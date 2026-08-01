<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeaders(['X-Requested-With' => 'XMLHttpRequest']);
    }

    public function test_guests_cannot_access_transactions()
    {
        $this->getJson(route('api.transactions.index'))->assertUnauthorized();
    }

    public function test_it_lists_only_the_authenticated_users_transactions()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Transaction::factory()->for($user)->create(['user_id' => $user->id]);
        Transaction::factory()->for($otherUser)->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->getJson(route('api.transactions.index'));

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
    }

    public function test_it_filters_transactions_by_account_and_category()
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->create();

        $matching = Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
        ]);

        Transaction::factory()->for($user)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson(route('api.transactions.index', [
            'accountId' => $account->id,
            'categoryId' => $category->id,
        ]));

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $matching->id);
    }

    public function test_it_lists_transactions_in_descending_transaction_date_order()
    {
        $user = User::factory()->create();

        $newer = Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'transaction_date' => now()->subDay()->toDateString(),
        ]);

        $older = Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'transaction_date' => now()->subDays(7)->toDateString(),
        ]);

        $response = $this->actingAs($user)->getJson(route('api.transactions.index'));

        $response->assertOk();
        $response->assertJsonPath('data.0.id', $newer->id);
        $response->assertJsonPath('data.1.id', $older->id);
    }

    public function test_it_returns_period_summary_for_the_selected_time_filter()
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create([
            'balance' => 650,
            'currency' => 'KES',
        ]);

        $incomeCategory = Category::factory()->for($user)->income()->create();
        $expenseCategory = Category::factory()->for($user)->expense()->create();

        Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $incomeCategory->id,
            'amount' => 300,
            'transaction_date' => '2026-01-05',
        ]);

        Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $expenseCategory->id,
            'amount' => 100,
            'transaction_date' => '2026-01-10',
        ]);

        Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $incomeCategory->id,
            'amount' => 500,
            'transaction_date' => '2026-02-03',
        ]);

        Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $expenseCategory->id,
            'amount' => 50,
            'transaction_date' => '2026-03-01',
        ]);

        $response = $this->actingAs($user)->getJson(route('api.transactions.index', [
            'filter' => 'month',
            'date' => '2026-01-15',
        ]));

        $response->assertOk();
        $response->assertJsonPath('summary.startingBalance', 0);
        $response->assertJsonPath('summary.endingBalance', 200);
        $response->assertJsonPath('summary.total', 200);
        $response->assertJsonPath('summary.currency', 'KES');
    }

    public function test_summary_total_reflects_the_filtered_visible_transactions()
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();

        $incomeCategory = Category::factory()->for($user)->income()->create();
        $expenseCategory = Category::factory()->for($user)->expense()->create();

        Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $incomeCategory->id,
            'amount' => 500,
            'notes' => 'salary august',
            'transaction_date' => now()->toDateString(),
        ]);

        Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $expenseCategory->id,
            'amount' => 120,
            'notes' => 'salary tax',
            'transaction_date' => now()->toDateString(),
        ]);

        Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $incomeCategory->id,
            'amount' => 800,
            'notes' => 'bonus',
            'transaction_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($user)->getJson(route('api.transactions.index', [
            'notes' => 'salary',
        ]));

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $response->assertJsonPath('summary.total', 380);
    }

    public function test_it_creates_a_transaction_and_applies_its_impact()
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 1000]);
        $category = Category::factory()->for($user)->expense()->create(['total' => 0]);

        $response = $this->actingAs($user)->postJson(route('transactions.store'), [
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount' => 300,
            'transaction_date' => now()->toDateString(),
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.amount.amount', 300);

        $this->assertDatabaseHas('accounts', ['id' => $account->id, 'balance' => 700]);
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'total' => 300]);
    }

    public function test_an_income_transaction_increases_the_account_balance()
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 1000]);
        $category = Category::factory()->for($user)->income()->create(['total' => 0]);

        $this->actingAs($user)->postJson(route('transactions.store'), [
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount' => 300,
            'transaction_date' => now()->toDateString(),
        ])->assertCreated();

        $this->assertDatabaseHas('accounts', ['id' => $account->id, 'balance' => 1300]);
    }

    public function test_creating_a_transaction_requires_category_account_amount_and_date()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('transactions.store'), []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['category_id', 'account_id', 'amount', 'transaction_date']);
    }

    public function test_it_cannot_create_a_transaction_using_another_users_category()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->postJson(route('transactions.store'), [
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount' => 100,
            'transaction_date' => now()->toDateString(),
        ]);

        $response->assertNotFound();
    }

    public function test_it_updates_a_transaction_and_reconciles_the_impact()
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 700]);
        $category = Category::factory()->for($user)->expense()->create(['total' => 300]);

        $transaction = Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 300,
        ]);

        $response = $this->actingAs($user)->putJson(route('transactions.update', $transaction), [
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount' => 500,
            'transaction_date' => now()->toDateString(),
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('accounts', ['id' => $account->id, 'balance' => 500]);
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'total' => 500]);
    }

    public function test_it_deletes_a_transaction_and_reverses_the_impact()
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 700]);
        $category = Category::factory()->for($user)->expense()->create(['total' => 300]);

        $transaction = Transaction::factory()->for($user)->create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 300,
        ]);

        $response = $this->actingAs($user)->deleteJson(route('transactions.destroy', $transaction));

        $response->assertOk();
        $this->assertDatabaseMissing('transactions', ['id' => $transaction->id]);
        $this->assertDatabaseHas('accounts', ['id' => $account->id, 'balance' => 1000]);
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'total' => 0]);
    }

    public function test_it_cannot_update_another_users_transaction()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $account = Account::factory()->for($otherUser)->create();
        $category = Category::factory()->for($otherUser)->create();

        $transaction = Transaction::factory()->for($otherUser)->create([
            'user_id' => $otherUser->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
        ]);

        $response = $this->actingAs($user)->putJson(route('transactions.update', $transaction), [
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount' => 999,
            'transaction_date' => now()->toDateString(),
        ]);

        $response->assertNotFound();
    }

    public function test_it_cannot_delete_another_users_transaction()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $account = Account::factory()->for($otherUser)->create();
        $category = Category::factory()->for($otherUser)->create();

        $transaction = Transaction::factory()->for($otherUser)->create([
            'user_id' => $otherUser->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
        ]);

        $response = $this->actingAs($user)->deleteJson(route('transactions.destroy', $transaction));

        $response->assertNotFound();
        $this->assertDatabaseHas('transactions', ['id' => $transaction->id]);
    }

    public function test_show_is_currently_unimplemented()
    {
        $user = User::factory()->create();
        $transaction = Transaction::factory()->for($user)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson(route('transactions.show', $transaction));

        $response->assertOk();
        $this->assertSame('', $response->getContent());
    }
}
