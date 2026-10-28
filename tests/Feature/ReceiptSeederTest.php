<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Receipt;
use App\Models\User;
use Database\Seeders\ReceiptSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReceiptSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_receipts_in_every_state_with_their_images(): void
    {
        Storage::fake(Receipt::DISK);

        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['is_default' => true, 'balance' => 0]);
        Category::factory()->for($user)->expense()->count(3)->create();

        $this->seed(ReceiptSeeder::class);

        $receipts = Receipt::query()->where('user_id', $user->id)->get();

        $this->assertSame(
            [Receipt::STATUS_CONFIRMED => 2, Receipt::STATUS_FAILED => 1, Receipt::STATUS_PROCESSING => 1, Receipt::STATUS_REVIEW => 2],
            $receipts->countBy('status')->sortKeys()->all(),
        );

        $receipts->each(fn (Receipt $receipt) => Storage::disk(Receipt::DISK)->assertExists($receipt->path));

        $confirmed = $receipts->where('status', Receipt::STATUS_CONFIRMED);
        $confirmedTotal = $confirmed->sum('total');

        $this->assertSame($confirmedTotal, (int) $confirmed->flatMap->transactions->sum('amount'));
        $this->assertSame(-$confirmedTotal, (int) $account->fresh()->balance, 'Confirmed receipts are charged to the account.');

        $receipts->where('status', Receipt::STATUS_REVIEW)
            ->each(fn (Receipt $receipt) => $this->assertNotEmpty($receipt->items));
    }

    public function test_users_without_an_account_or_expense_categories_are_skipped(): void
    {
        Storage::fake(Receipt::DISK);

        User::factory()->create();

        $this->seed(ReceiptSeeder::class);

        $this->assertSame(0, Receipt::query()->count());
    }
}
