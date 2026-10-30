<?php

namespace App\Http\Services;

use App\Ai\Agents\ReceiptScanner;
use App\Jobs\ProcessReceipt;
use App\Models\Account;
use App\Models\Category;
use App\Models\Receipt;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Ai\Files\Document;
use Laravel\Ai\Files\Image;
use Throwable;

class ReceiptService extends Service
{
    public function __construct(protected TransactionService $transactionService) {}

    /**
     * Store an uploaded receipt and queue it for scanning.
     *
     * @throws ValidationException
     */
    public function upload(User $user, UploadedFile $file): Receipt
    {
        $fileHash = hash_file('sha256', $file->getRealPath());

        $isDuplicate = Receipt::query()
            ->where('user_id', $user->id)
            ->where('file_hash', $fileHash)
            ->where('status', '!=', Receipt::STATUS_FAILED)
            ->exists();

        if ($isDuplicate) {
            throw ValidationException::withMessages(['file' => __('You have already uploaded this receipt.')]);
        }

        $path = $file->store("receipts/{$user->id}", Receipt::DISK);

        $receipt = Receipt::create([
            'user_id' => $user->id,
            'account_id' => $this->defaultAccountFor($user)?->id,
            'path' => $path,
            'original_name' => Str::limit($file->getClientOriginalName(), 250, ''),
            'mime_type' => $file->getMimeType(),
            'file_hash' => $fileHash,
            'status' => Receipt::STATUS_PROCESSING,
            'processing_step' => Receipt::STEP_QUEUED,
            'processing_step_at' => now(),
        ]);

        ProcessReceipt::dispatch($receipt);

        return $receipt;
    }

    /**
     * Send a failed receipt back through the scanner.
     */
    public function retry(Receipt $receipt): Receipt
    {
        $receipt->update([
            'status' => Receipt::STATUS_PROCESSING,
            'processing_step' => Receipt::STEP_QUEUED,
            'processing_attempt' => null,
            'processing_step_at' => now(),
            'failure_reason' => null,
        ]);

        ProcessReceipt::dispatch($receipt);

        return $receipt;
    }

    /**
     * Read the receipt with the AI scanner and save the extracted line items for review.
     *
     * @throws Throwable when the AI provider fails, so the job can retry.
     */
    public function process(Receipt $receipt, int $attempt = 1): void
    {
        $receipt->moveToStep(Receipt::STEP_PREPARING, $attempt);

        $categories = $this->expenseCategoriesFor($receipt->user_id);

        $attachment = $receipt->isPdf()
            ? Document::fromStorage($receipt->path, Receipt::DISK)
            : Image::fromStorage($receipt->path, Receipt::DISK);

        $receipt->moveToStep(Receipt::STEP_READING);

        try {
            $extraction = (new ReceiptScanner($categories))
                ->prompt('Extract the details of this receipt.', attachments: [$attachment])
                ->toArray();
        } catch (Throwable $exception) {
            Log::error('Receipt scan: the AI request failed.', [
                ...$this->logContext($receipt),
                'exception' => $exception,
            ]);

            throw $exception;
        }

        $receipt->moveToStep(Receipt::STEP_SORTING);

        $allowedCategoryIds = array_column($categories, 'id');

        $items = collect($extraction['items'] ?? [])
            ->map(fn (array $item): array => [
                'description' => Str::limit(trim((string) ($item['description'] ?? '')), 250, ''),
                'quantity' => max((float) ($item['quantity'] ?? 1), 0),
                'amount' => $this->toWholeAmount($item['amount'] ?? null) ?? 0,
                'category_id' => in_array($item['category_id'] ?? null, $allowedCategoryIds, true)
                    ? $item['category_id']
                    : null,
            ])
            ->filter(fn (array $item): bool => $item['description'] !== '' && $item['amount'] > 0)
            ->values();

        $total = $this->toWholeAmount($extraction['total'] ?? null) ?? (int) $items->sum('amount');

        if (! ($extraction['is_receipt'] ?? false) || ($items->isEmpty() && $total <= 0)) {
            $receipt->update([
                'status' => Receipt::STATUS_FAILED,
                'processing_step' => null,
                'extraction' => $extraction,
                'failure_reason' => __("This doesn't look like a readable receipt. Try a clearer photo, or enter the items manually."),
            ]);

            return;
        }

        DB::transaction(function() use ($receipt, $extraction, $items, $total) {
            $receipt->items()->delete();

            $receipt->items()->createMany(
                $items->map(fn (array $item, int $index): array => [...$item, 'position' => $index])->all()
            );

            $receipt->update([
                'status' => Receipt::STATUS_REVIEW,
                'processing_step' => null,
                'merchant' => filled($extraction['merchant'] ?? null) ? Str::limit(trim($extraction['merchant']), 250, '') : null,
                'receipt_date' => $this->toReceiptDate($extraction['date'] ?? null),
                'currency' => $this->toCurrency($extraction['currency'] ?? null) ?? $receipt->currency,
                'total' => $total,
                'tax' => $this->toWholeAmount($extraction['tax'] ?? null),
                'discount' => $this->toWholeAmount($extraction['discount'] ?? null),
                'extraction' => $extraction,
                'failure_reason' => null,
            ]);
        });
    }

    /**
     * Mark a receipt as unreadable after the scanner gave up.
     */
    public function markFailed(Receipt $receipt, ?Throwable $exception = null): void
    {
        Log::error('Receipt scan: gave up after the last attempt.', [
            ...$this->logContext($receipt),
            'exception' => $exception,
        ]);

        $receipt->update([
            'status' => Receipt::STATUS_FAILED,
            'processing_step' => null,
            'failure_reason' => __("We couldn't read this receipt right now. Try again, or enter the items manually."),
        ]);
    }

    /**
     * Save the reviewed line items and create one transaction per item.
     *
     * @param  array{account_id: string, merchant?: string|null, receipt_date: string, total: int, items: array<int, array{description: string, quantity?: float|int|null, amount: int, category_id: string}>}  $data
     *
     * @throws ValidationException
     */
    public function confirm(Receipt $receipt, array $data): Receipt
    {
        return DB::transaction(function() use ($receipt, $data) {
            $receipt = Receipt::query()->lockForUpdate()->findOrFail($receipt->id);

            if (! $receipt->isEditable()) {
                throw ValidationException::withMessages(['receipt' => __('This receipt has already been confirmed.')]);
            }

            $account = Account::query()->where('user_id', $receipt->user_id)->findOrFail($data['account_id']);

            $items = collect($data['items'])->values();

            $categories = Category::query()
                ->where('user_id', $receipt->user_id)
                ->whereIn('id', $items->pluck('category_id')->unique())
                ->get()
                ->keyBy('id');

            $merchant = filled($data['merchant'] ?? null) ? trim($data['merchant']) : null;
            $transactionDate = CarbonImmutable::parse($data['receipt_date'])->setTimeFrom(now());

            $receipt->items()->delete();
            $receipt->items()->createMany(
                $items->map(fn (array $item, int $index): array => [
                    'description' => $item['description'],
                    'quantity' => $item['quantity'] ?? 1,
                    'amount' => $item['amount'],
                    'category_id' => $item['category_id'],
                    'position' => $index,
                ])->all()
            );

            $allocatedAmounts = $this->allocateTotal(
                $items->map(fn (array $item): int => (int) $item['amount'])->all(),
                (int) $data['total'],
            );

            foreach ($allocatedAmounts as $index => $amount) {
                if ($amount <= 0) {
                    continue;
                }

                $this->transactionService->createTransaction(
                    $categories[$items[$index]['category_id']],
                    $account,
                    $amount,
                    $this->transactionNotes($merchant, $items[$index]['description']),
                    $transactionDate,
                    $receipt->id,
                );

                // Reload so the next item in the loop sees the updated balance.
                $account->refresh();
            }

            $receipt->update([
                'status' => Receipt::STATUS_CONFIRMED,
                'account_id' => $account->id,
                'merchant' => $merchant,
                'receipt_date' => $transactionDate->toDateString(),
                'total' => (int) $data['total'],
                'failure_reason' => null,
                'confirmed_at' => now(),
            ]);

            return $receipt->load(['items', 'transactions.category']);
        });
    }

    /**
     * Delete a receipt and its stored file. Transactions created from it are kept.
     */
    public function delete(Receipt $receipt): void
    {
        Storage::disk(Receipt::DISK)->delete($receipt->path);

        $receipt->delete();
    }

    /**
     * Split the receipt total across items in proportion to their amounts,
     * so tax, discounts and rounding are shared out and the amounts add up exactly.
     *
     * @param  array<array-key, int>  $subtotals
     * @return array<array-key, int>
     */
    public function allocateTotal(array $subtotals, int $total): array
    {
        $itemsTotal = array_sum($subtotals);

        if ($itemsTotal <= 0 || $itemsTotal === $total) {
            return $subtotals;
        }

        $allocated = [];
        $remainders = [];

        foreach ($subtotals as $key => $subtotal) {
            $exact = $subtotal * $total / $itemsTotal;
            $allocated[$key] = (int) floor($exact);
            $remainders[$key] = $exact - floor($exact);
        }

        arsort($remainders);

        foreach (array_keys($remainders) as $key) {
            if (array_sum($allocated) >= $total) {
                break;
            }

            $allocated[$key]++;
        }

        return $allocated;
    }

    /**
     * Details logged with scan failures so they can be traced in Telescope.
     *
     * @return array{receipt_id: string, user_id: string, step: string|null, attempt: int|null, mime_type: string, model: mixed}
     */
    private function logContext(Receipt $receipt): array
    {
        return [
            'receipt_id' => (string) $receipt->id,
            'user_id' => (string) $receipt->user_id,
            'step' => $receipt->processing_step,
            'attempt' => $receipt->processing_attempt,
            'mime_type' => $receipt->mime_type,
            'model' => config('ai.providers.gemini.models.text.default'),
        ];
    }

    /**
     * @return array<int, array{id: string, name: string}>
     */
    private function expenseCategoriesFor(string $userId): array
    {
        return Category::query()
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->orderBy('position')
            ->get(['id', 'name'])
            ->map(fn (Category $category): array => ['id' => (string) $category->id, 'name' => $category->name])
            ->all();
    }

    private function defaultAccountFor(User $user): ?Account
    {
        return Account::query()
            ->where('user_id', $user->id)
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->first();
    }

    private function toWholeAmount(mixed $value): ?int
    {
        if (! is_numeric($value)) {
            return null;
        }

        return (int) round(abs((float) $value));
    }

    private function toReceiptDate(mixed $value): ?string
    {
        if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return null;
        }

        try {
            $date = CarbonImmutable::createFromFormat('Y-m-d', $value)->startOfDay();
        } catch (Throwable) {
            return null;
        }

        return $date->isAfter(now()->endOfDay()) ? null : $date->toDateString();
    }

    private function toCurrency(mixed $value): ?string
    {
        $currency = is_string($value) ? strtoupper(trim($value)) : '';

        return preg_match('/^[A-Z]{3}$/', $currency) ? $currency : null;
    }

    private function transactionNotes(?string $merchant, string $description): string
    {
        return Str::limit($merchant ? "{$merchant}: {$description}" : $description, 250);
    }
}
