<?php

namespace Tests\Feature;

use App\Ai\Agents\ReceiptScanner;
use App\Models\Account;
use App\Models\Category;
use App\Models\Receipt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * A Carrefour receipt printed 1/11/26 (1 November) was read as 11 January,
 * so its transactions were filed ten months back.
 */
class ReceiptDateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake(Receipt::DISK);

        $this->withHeaders(['X-Requested-With' => 'XMLHttpRequest']);
    }

    /**
     * @return array<string, array{0: string|null, 1: string|null}>
     */
    public static function scannedDates(): array
    {
        return [
            'day and month swapped' => ['2026-01-11', '2026-11-01'],
            'swapped into the future' => ['2026-12-10', '2026-10-12'],
            'correct recent date' => ['2026-10-28', '2026-10-28'],
            'old receipt that cannot be swapped' => ['2026-03-25', '2026-03-25'],
            'old receipt whose swap is not recent either' => ['2026-02-03', '2026-02-03'],
            'same day and month' => ['2026-05-05', '2026-05-05'],
            'future date that cannot be swapped' => ['2026-11-20', null],
            'impossible date' => ['2026-02-30', null],
        ];
    }

    #[DataProvider('scannedDates')]
    public function test_receipt_dates_read_month_first_are_corrected(?string $scanned, ?string $expected): void
    {
        $this->travelTo('2026-11-01 18:07:42');

        $user = User::factory()->create();
        Account::factory()->for($user)->create(['is_default' => true]);
        $category = Category::factory()->for($user)->expense()->create();

        ReceiptScanner::fake([[
            'is_receipt' => true,
            'merchant' => 'Carrefour',
            'date' => $scanned,
            'currency' => 'KES',
            'total' => 550,
            'tax' => null,
            'discount' => null,
            'items' => [['description' => 'Dish Cover', 'quantity' => 1, 'amount' => 550, 'category_id' => $category->id]],
        ]]);

        $this->actingAs($user)->postJson(route('api.receipts.store'), [
            'file' => UploadedFile::fake()->image('receipt.jpg'),
        ])->assertCreated();

        $this->assertSame($expected, Receipt::query()->sole()->receipt_date?->toDateString());
    }

    public function test_the_scanner_is_told_dates_are_day_first(): void
    {
        $instructions = (string) (new ReceiptScanner)->instructions();

        $this->assertStringContainsString('1/11/26 or 01-11-2026 is 1 November 2026', $instructions);
    }
}
