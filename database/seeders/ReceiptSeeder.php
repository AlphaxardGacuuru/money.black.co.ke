<?php

namespace Database\Seeders;

use App\Http\Services\ReceiptService;
use App\Models\Account;
use App\Models\Category;
use App\Models\Receipt;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReceiptSeeder extends Seeder
{
    /**
     * Shops and the kind of items they sell, for realistic-looking receipts.
     *
     * @var array<string, array<int, array{0: string, 1: int}>>
     */
    private const SHOPS = [
        'Naivas Westlands' => [['Bread 400g', 65], ['Milk 500ml', 60], ['Sugar 2kg', 380], ['Omo 1kg', 450], ['Eggs tray', 420], ['Cooking oil 1L', 350]],
        'Carrefour Junction' => [['Rice 2kg', 420], ['Tomatoes 1kg', 140], ['Chicken 1kg', 690], ['Tissue 10pk', 520], ['Yoghurt 500ml', 210]],
        'Quickmart Kilimani' => [['Maize flour 2kg', 210], ['Sukuma wiki', 50], ['Onions 1kg', 120], ['Soap bar', 95], ['Juice 1L', 260]],
        'Java House' => [['Cappuccino', 350], ['Chicken wrap', 750], ['Fresh juice', 400], ['Muffin', 280]],
        'TotalEnergies Ngong Rd' => [['Petrol V-Power', 3000], ['Car wash', 500], ['Water 1L', 100]],
        'Goodlife Pharmacy' => [['Paracetamol', 120], ['Vitamin C', 650], ['Plasters', 180]],
    ];

    public function __construct(protected ReceiptService $receiptService) {}

    /**
     * Seed receipts in every state (processing, review, failed and confirmed), each with a generated receipt image.
     */
    public function run(): void
    {
        User::query()->select('id')->each(function(User $user): void {
            $account = Account::query()->where('user_id', $user->id)->orderByDesc('is_default')->first();
            $categories = Category::query()->where('user_id', $user->id)->where('type', 'expense')->get();

            if (! $account || $categories->isEmpty()) {
                return;
            }

            $shops = collect(self::SHOPS)->keys()->shuffle();

            foreach (range(1, 2) as $index) {
                $receipt = $this->readReceipt($user, $account, $categories, $shops->pop(), now()->subDays(random_int(10, 40)));

                $this->receiptService->confirm($receipt, [
                    'account_id' => $account->id,
                    'merchant' => $receipt->merchant,
                    'receipt_date' => $receipt->receipt_date->toDateString(),
                    'total' => $receipt->total,
                    'items' => $receipt->items->map(fn ($item): array => [
                        'description' => $item->description,
                        'quantity' => (float) $item->quantity,
                        'amount' => $item->amount,
                        'category_id' => $item->category_id,
                    ])->all(),
                ]);
            }

            foreach (range(1, 2) as $index) {
                $this->readReceipt($user, $account, $categories, $shops->pop(), now()->subDays(random_int(0, 7)));
            }

            $this->storedReceipt($user, $account, $shops->pop(), [], [
                'status' => Receipt::STATUS_FAILED,
                'failure_reason' => __("This doesn't look like a readable receipt. Try a clearer photo, or enter the items manually."),
                'created_at' => now()->subDays(2),
            ]);

            $this->storedReceipt($user, $account, $shops->pop(), [], [
                'status' => Receipt::STATUS_PROCESSING,
                'processing_step' => Receipt::STEP_READING,
                'processing_attempt' => 1,
                'processing_step_at' => now(),
            ]);
        });
    }

    /**
     * A receipt the scanner has read, with its items sorted into categories and waiting for review.
     *
     * @param  Collection<int, Category>  $categories
     */
    private function readReceipt(User $user, Account $account, Collection $categories, string $shop, mixed $date): Receipt
    {
        $lines = collect(self::SHOPS[$shop])->shuffle()->take(random_int(2, 5))->values()
            ->map(fn (array $line): array => ['description' => $line[0], 'quantity' => random_int(1, 2), 'unit_price' => $line[1]]);

        $receiptDate = CarbonImmutable::parse($date);
        $total = (int) $lines->sum(fn (array $line): int => $line['quantity'] * $line['unit_price']);

        $receipt = $this->storedReceipt($user, $account, $shop, $lines->all(), [
            'status' => Receipt::STATUS_REVIEW,
            'merchant' => $shop,
            'receipt_date' => $receiptDate->toDateString(),
            'total' => $total,
            'tax' => (int) round($total * 16 / 116),
            'created_at' => $receiptDate,
        ], $receiptDate);

        $receipt->items()->createMany($lines->map(fn (array $line, int $index): array => [
            'description' => $line['description'],
            'quantity' => $line['quantity'],
            'amount' => $line['quantity'] * $line['unit_price'],
            'category_id' => $categories->random()->id,
            'position' => $index,
        ])->all());

        return $receipt->load('items');
    }

    /**
     * Save a generated receipt image and create its record.
     *
     * @param  array<int, array{description: string, quantity: int, unit_price: int}>  $lines
     * @param  array<string, mixed>  $attributes
     */
    private function storedReceipt(User $user, Account $account, string $shop, array $lines, array $attributes, ?CarbonImmutable $date = null): Receipt
    {
        $image = $this->receiptImage($shop, $lines, $date ?? CarbonImmutable::now());
        $path = "receipts/{$user->id}/" . Str::uuid() . '.jpg';

        Storage::disk(Receipt::DISK)->put($path, $image);

        return Receipt::query()->forceCreate([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'path' => $path,
            'original_name' => Str::slug($shop) . '.jpg',
            'mime_type' => 'image/jpeg',
            'file_hash' => hash('sha256', $image),
            'currency' => 'KES',
            ...$attributes,
        ]);
    }

    /**
     * Draw a simple till-roll receipt as a JPEG.
     *
     * @param  array<int, array{description: string, quantity: int, unit_price: int}>  $lines
     */
    private function receiptImage(string $shop, array $lines, CarbonImmutable $date): string
    {
        $width = 420;
        $lineHeight = 22;
        $height = 260 + max(count($lines), 3) * $lineHeight;

        $image = imagecreatetruecolor($width, $height);
        $paper = imagecolorallocate($image, 250, 248, 240);
        $ink = imagecolorallocate($image, 40, 40, 40);
        imagefill($image, 0, 0, $paper);

        $y = 24;
        $center = fn (string $text): int => (int) (($width - strlen($text) * imagefontwidth(5)) / 2);
        $row = function(string $left, string $right = '') use ($image, $ink, $width, &$y, $lineHeight): void {
            imagestring($image, 4, 24, $y, $left, $ink);
            imagestring($image, 4, $width - 24 - strlen($right) * imagefontwidth(4), $y, $right, $ink);
            $y += $lineHeight;
        };

        imagestring($image, 5, $center(strtoupper($shop)), $y, strtoupper($shop), $ink);
        $y += 30;
        $row($date->format('d/m/Y H:i'), 'Till #' . random_int(100, 999));
        $row(str_repeat('-', 44));

        $total = 0;

        foreach ($lines ?: [['description' => '~~~~~~~~', 'quantity' => 1, 'unit_price' => 0]] as $line) {
            $amount = $line['quantity'] * $line['unit_price'];
            $total += $amount;
            $row("{$line['quantity']} x {$line['description']}", $amount > 0 ? number_format($amount, 2) : '');
        }

        $row(str_repeat('-', 44));
        $row('TOTAL KES', number_format($total, 2));
        $row('VAT 16% incl.', number_format($total * 16 / 116, 2));
        $y += 12;
        $row('Thank you for shopping with us');

        ob_start();
        imagejpeg($image, null, 85);
        imagedestroy($image);

        return (string) ob_get_clean();
    }
}
