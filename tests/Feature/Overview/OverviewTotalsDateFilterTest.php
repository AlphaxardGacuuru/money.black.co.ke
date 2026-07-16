<?php

namespace Tests\Feature\Overview;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OverviewTotalsDateFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_overview_totals_use_current_date_filter_window(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $account = Account::query()->forceCreate([
            'user_id' => $user->id,
            'icon' => 'wallet',
            'color' => '#111827',
            'name' => 'Main Account',
            'currency' => 'KES',
            'type' => 'regular',
            'description' => null,
            'is_default' => true,
            'balance' => 0,
        ]);

        $expenseCategory = Category::query()->forceCreate([
            'user_id' => $user->id,
            'name' => 'Transport',
            'icon' => 'car',
            'color' => '#ef4444',
            'type' => 'expense',
            'position' => 1,
            'total' => 1199,
        ]);

        $incomeCategory = Category::query()->forceCreate([
            'user_id' => $user->id,
            'name' => 'Salary',
            'icon' => 'wallet',
            'color' => '#22c55e',
            'type' => 'income',
            'position' => 2,
            'total' => 6000,
        ]);

        // In-range transactions (January 2026)
        Transaction::query()->forceCreate([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $expenseCategory->id,
            'amount' => 200,
            'currency' => 'KES',
            'notes' => null,
            'transaction_date' => Carbon::parse('2026-01-10'),
        ]);

        Transaction::query()->forceCreate([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $incomeCategory->id,
            'amount' => 1000,
            'currency' => 'KES',
            'notes' => null,
            'transaction_date' => Carbon::parse('2026-01-11'),
        ]);

        // Out-of-range transactions (February 2026)
        Transaction::query()->forceCreate([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $expenseCategory->id,
            'amount' => 999,
            'currency' => 'KES',
            'notes' => null,
            'transaction_date' => Carbon::parse('2026-02-10'),
        ]);

        Transaction::query()->forceCreate([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $incomeCategory->id,
            'amount' => 5000,
            'currency' => 'KES',
            'notes' => null,
            'transaction_date' => Carbon::parse('2026-02-11'),
        ]);

        $response = $this->getJson('/api/overview?filter=month&date=2026-01-15');

        $response
            ->assertOk()
            ->assertJsonPath('totals.expense', 200)
            ->assertJsonPath('totals.income', 1000)
            ->assertJsonPath('totals.net', 800);
    }
}
