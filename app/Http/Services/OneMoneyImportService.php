<?php

namespace App\Http\Services;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OneMoneyImportService
{
    public function import(Request $request): array
    {
        $content = $this->extractContent($request);
        $rows = $this->parseRows($content);

        if (count($rows) === 0) {
            return [false, 'No importable rows were found in the uploaded data.', [
                'rows' => 0,
                'imported' => 0,
                'duplicates' => 0,
                'skipped' => 0,
                'createdAccounts' => 0,
                'createdCategories' => 0,
            ]];
        }

        $summary = DB::transaction(function () use ($request, $rows): array {
            $userId = $request->user()->id;

            $accountsByName = Account::query()
                ->where('user_id', $userId)
                ->get()
                ->keyBy(fn(Account $account): string => $this->key($account->name));

            $categoriesByName = Category::query()
                ->where('user_id', $userId)
                ->get()
                ->keyBy(fn(Category $category): string => $this->key($category->name));

            $createdAccounts = 0;
            $createdCategories = 0;
            $duplicates = 0;
            $skipped = 0;
            $imported = 0;

            foreach ($rows as $row) {
                $fromAccount = trim($this->pick($row, ['FROMACCOUNT', 'FROMACC', 'ACCOUNT']));
                $toAccount = trim($this->pick($row, ['TOACCOUNT', 'TOACCOU', 'TOACCOUA', 'CATEGORY']));
                $amount = $this->parseAmount($this->pick($row, ['AMOUNT', 'AMOUNT1']));
                $currency = strtoupper(trim($this->pick($row, ['CURRENCY', 'CURRENCY1'])));
                $type = $this->normalizeType($this->pick($row, ['TYPE', 'TRANSACTIONTYPE']));

                $notes = trim($this->pick($row, ['NOTES', 'NOTE', 'DESCRIPTION']));
                $tags = trim($this->pick($row, ['TAGS', 'TAG']));

                if ($notes === '' && $tags !== '') {
                    $notes = $tags;
                }

                if ($notes !== '' && $tags !== '') {
                    $notes = $notes . ' [Tags: ' . $tags . ']';
                }

                $transactionDate = $this->parseDate($this->pick($row, ['DATE', 'TRANSACTIONDATE']));

                if ($fromAccount === '' || $toAccount === '' || $amount <= 0 || $transactionDate === null) {
                    $skipped++;

                    continue;
                }

                $currency = $currency !== '' ? $currency : 'KES';

                $accountKey = $this->key($fromAccount);
                $account = $accountsByName->get($accountKey);

                if (! $account instanceof Account) {
                    $account = new Account;
                    $account->user_id = $userId;
                    $account->icon = 'wallet';
                    $account->color = '#0f766e';
                    $account->name = $fromAccount;
                    $account->currency = $currency;
                    $account->type = 'regular';
                    $account->is_default = false;
                    $account->balance = 0;
                    $account->save();

                    $accountsByName->put($accountKey, $account);
                    $createdAccounts++;
                }

                $categoryKey = $this->key($toAccount);
                $category = $categoriesByName->get($categoryKey);

                if (! $category instanceof Category) {
                    $nextPosition = (int) Category::query()
                        ->where('user_id', $userId)
                        ->max('position') + 1;

                    $category = new Category;
                    $category->user_id = $userId;
                    $category->icon = 'tags';
                    $category->color = '#1d4ed8';
                    $category->name = $toAccount;
                    $category->type = $type;
                    $category->position = $nextPosition;
                    $category->total = 0;
                    $category->save();

                    $categoriesByName->put($categoryKey, $category);
                    $createdCategories++;
                }

                $duplicateQuery = Transaction::query()
                    ->where('user_id', $userId)
                    ->where('account_id', $account->id)
                    ->where('category_id', $category->id)
                    ->where('amount', $amount)
                    ->where('currency', $currency)
                    ->whereDate('transaction_date', $transactionDate->toDateString());

                if ($notes === '') {
                    $duplicateQuery->whereNull('notes');
                } else {
                    $duplicateQuery->where('notes', $notes);
                }

                if ($duplicateQuery->exists()) {
                    $duplicates++;

                    continue;
                }

                $transaction = new Transaction;
                $transaction->user_id = $userId;
                $transaction->category_id = $category->id;
                $transaction->account_id = $account->id;
                $transaction->amount = $amount;
                $transaction->currency = $currency;
                $transaction->notes = $notes !== '' ? $notes : null;
                $transaction->transaction_date = $transactionDate;
                $transaction->save();

                $category->total += $amount;
                $category->save();

                if ($category->type === 'expense') {
                    $account->balance -= $amount;
                } else {
                    $account->balance += $amount;
                }

                $account->save();
                $imported++;
            }

            return [
                'rows' => count($rows),
                'imported' => $imported,
                'duplicates' => $duplicates,
                'skipped' => $skipped,
                'createdAccounts' => $createdAccounts,
                'createdCategories' => $createdCategories,
            ];
        });

        return [true, '1Money data imported successfully.', $summary];
    }

    private function extractContent(Request $request): string
    {
        return (string) file_get_contents($request->file('file')->getRealPath());
    }

    private function parseRows(string $content): array
    {
        $normalized = trim(str_replace(["\r\n", "\r"], "\n", $content));

        if ($normalized === '') {
            return [];
        }

        $firstLine = strtok($normalized, "\n") ?: '';
        $delimiter = $this->detectDelimiter($firstLine);

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $normalized);
        rewind($stream);

        $rows = [];
        $headers = [];

        while (($line = fgetcsv($stream, 0, $delimiter)) !== false) {
            if ($headers === []) {
                $headers = array_map(fn($value): string => $this->normalizeHeader((string) $value), $line);

                continue;
            }

            if (count(array_filter($line, fn($value): bool => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $row = [];

            foreach ($headers as $index => $header) {
                $row[$header] = isset($line[$index]) ? trim((string) $line[$index]) : '';
            }

            $rows[] = $row;
        }

        fclose($stream);

        return $rows;
    }

    private function detectDelimiter(string $line): string
    {
        $tabCount = substr_count($line, "\t");
        $commaCount = substr_count($line, ',');
        $semiColonCount = substr_count($line, ';');

        if ($tabCount > 0) {
            return "\t";
        }

        if ($semiColonCount > $commaCount) {
            return ';';
        }

        return ',';
    }

    private function normalizeHeader(string $header): string
    {
        $cleaned = preg_replace('/^\xEF\xBB\xBF/', '', $header) ?? $header;

        return $this->key($cleaned);
    }

    private function key(string $value): string
    {
        return strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', trim($value)));
    }

    private function pick(array $row, array $candidateKeys): string
    {
        foreach ($candidateKeys as $candidateKey) {
            if (isset($row[$candidateKey]) && $row[$candidateKey] !== '') {
                return (string) $row[$candidateKey];
            }

            foreach ($row as $header => $value) {
                if ($value === '') {
                    continue;
                }

                if (str_starts_with($header, $candidateKey)) {
                    return (string) $value;
                }
            }
        }

        return '';
    }

    private function parseAmount(string $amount): int
    {
        $cleaned = preg_replace('/[^0-9.-]/', '', $amount) ?? '';

        if ($cleaned === '' || ! is_numeric($cleaned)) {
            return 0;
        }

        return (int) round((float) $cleaned);
    }

    private function normalizeType(string $type): string
    {
        $normalized = strtolower(trim($type));

        if (str_contains($normalized, 'income')) {
            return 'income';
        }

        return 'expense';
    }

    private function parseDate(string $value): ?Carbon
    {
        $trimmed = trim($value);

        if ($trimmed === '') {
            return null;
        }

        $formats = ['d-m-y', 'd/m/y', 'Y-m-d', 'd-m-Y', 'd/m/Y', 'm/d/Y', 'm-d-Y'];

        foreach ($formats as $format) {
            try {
                return Carbon::createFromFormat($format, $trimmed)->startOfDay();
            } catch (\Throwable) {
                continue;
            }
        }

        try {
            return Carbon::parse($trimmed)->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }
}
