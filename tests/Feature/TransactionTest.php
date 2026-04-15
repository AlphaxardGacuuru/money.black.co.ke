<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TransactionTest extends TestCase
{
	use RefreshDatabase;

	public function test_store_creates_transaction_and_updates_expense_balances(): void
	{
		$user = User::factory()->create();
		$this->actingAs($user);

		$account = new Account;
		$account->user_id = $user->id;
		$account->icon = 'wallet';
		$account->color = '#000000';
		$account->name = 'Cash';
		$account->currency = 'TZS';
		$account->balance = 5000;
		$account->save();

		$category = new Category;
		$category->user_id = $user->id;
		$category->icon = 'utensils';
		$category->color = '#000000';
		$category->name = 'Food';
		$category->type = 'expense';
		$category->total = 0;
		$category->save();

		$response = $this->post(route('transactions.store'), [
			'category_id' => $category->id,
			'account_id' => $account->id,
			'amount' => 1250,
			'notes' => 'Lunch',
			'transaction_date' => now()->toDateString(),
		]);

		$response->assertRedirect('/categories')
			->assertInertiaFlash('toast.type', 'success')
			->assertInertiaFlash('toast.message', 'Transaction Added Successfully');

		$this->assertDatabaseCount('transactions', 1);

		$transaction = Transaction::firstOrFail();
		$this->assertSame(1250, $transaction->amount);
		$this->assertSame('TZS', $transaction->currency);

		$category->refresh();
		$account->refresh();

		$this->assertSame(1250, $category->total);
		$this->assertSame(3750, $account->balance);
	}

	public function test_store_creates_transaction_and_updates_income_balances(): void
	{
		$user = User::factory()->create();
		$this->actingAs($user);

		$account = new Account;
		$account->user_id = $user->id;
		$account->icon = 'wallet';
		$account->color = '#000000';
		$account->name = 'Cash';
		$account->currency = 'UGX';
		$account->balance = 5000;
		$account->save();

		$category = new Category;
		$category->user_id = $user->id;
		$category->icon = 'briefcase';
		$category->color = '#000000';
		$category->name = 'Salary';
		$category->type = 'income';
		$category->total = 0;
		$category->save();

		$this->post(route('transactions.store'), [
			'category_id' => $category->id,
			'account_id' => $account->id,
			'amount' => 2000,
			'notes' => 'Payroll',
			'transaction_date' => now()->toDateString(),
		]);

		$category->refresh();
		$account->refresh();
		$transaction = Transaction::latest('created_at')->firstOrFail();

		$this->assertSame(2000, $category->total);
		$this->assertSame(7000, $account->balance);
		$this->assertSame('UGX', $transaction->currency);
	}

	public function test_index_shows_only_the_authenticated_users_transactions(): void
	{
		$user = User::factory()->create();
		$otherUser = User::factory()->create();
		$this->actingAs($user);

		$account = new Account;
		$account->user_id = $user->id;
		$account->icon = 'wallet';
		$account->color = '#123456';
		$account->name = 'Main Wallet';
		$account->currency = 'KES';
		$account->balance = 25000;
		$account->save();

		$category = new Category;
		$category->user_id = $user->id;
		$category->icon = 'briefcase';
		$category->color = '#654321';
		$category->name = 'Salary';
		$category->type = 'income';
		$category->total = 45000;
		$category->save();

		$transaction = new Transaction;
		$transaction->user_id = $user->id;
		$transaction->account_id = $account->id;
		$transaction->category_id = $category->id;
		$transaction->amount = 45000;
		$transaction->currency = 'KES';
		$transaction->notes = 'April salary';
		$transaction->transaction_date = now()->subDay();
		$transaction->save();

		$otherAccount = new Account;
		$otherAccount->user_id = $otherUser->id;
		$otherAccount->icon = 'wallet';
		$otherAccount->color = '#000000';
		$otherAccount->name = 'Other Wallet';
		$otherAccount->currency = 'UGX';
		$otherAccount->balance = 1500;
		$otherAccount->save();

		$otherCategory = new Category;
		$otherCategory->user_id = $otherUser->id;
		$otherCategory->icon = 'food';
		$otherCategory->color = '#111111';
		$otherCategory->name = 'Food';
		$otherCategory->type = 'expense';
		$otherCategory->total = 400;
		$otherCategory->save();

		$otherTransaction = new Transaction;
		$otherTransaction->user_id = $otherUser->id;
		$otherTransaction->account_id = $otherAccount->id;
		$otherTransaction->category_id = $otherCategory->id;
		$otherTransaction->amount = 400;
		$otherTransaction->currency = 'UGX';
		$otherTransaction->notes = 'Lunch';
		$otherTransaction->transaction_date = now();
		$otherTransaction->save();

		$response = $this->get(route('transactions.index'));

		$response->assertOk()
			->assertInertia(fn(Assert $page) => $page
				->component('transactions/index')
				->has('transactions.data', 1)
				->has('accounts.data', 1)
				->has('categories.data', 1)
				->where('transactions.data.0.id', $transaction->id)
				->where('transactions.data.0.notes', 'April salary')
				->where('transactions.data.0.account.name', 'Main Wallet')
				->where('transactions.data.0.account.balance.formatted', '25,000.00')
				->where('transactions.data.0.category.name', 'Salary'));
		$this->assertSame('income', data_get($response->viewData('page'), 'props.transactions.data.0.category.type'));

		$this->assertNotEquals($transaction->id, $otherTransaction->id);
	}

	public function test_update_rebalances_accounts_and_categories(): void
	{
		$user = User::factory()->create();
		$this->actingAs($user);

		$originalAccount = new Account;
		$originalAccount->user_id = $user->id;
		$originalAccount->icon = 'wallet';
		$originalAccount->color = '#000000';
		$originalAccount->name = 'Cash';
		$originalAccount->currency = 'KES';
		$originalAccount->balance = 4000;
		$originalAccount->save();

		$updatedAccount = new Account;
		$updatedAccount->user_id = $user->id;
		$updatedAccount->icon = 'wallet';
		$updatedAccount->color = '#123456';
		$updatedAccount->name = 'Bank';
		$updatedAccount->currency = 'USD';
		$updatedAccount->balance = 500;
		$updatedAccount->save();

		$originalCategory = new Category;
		$originalCategory->user_id = $user->id;
		$originalCategory->icon = 'food';
		$originalCategory->color = '#222222';
		$originalCategory->name = 'Food';
		$originalCategory->type = 'expense';
		$originalCategory->total = 1000;
		$originalCategory->save();

		$updatedCategory = new Category;
		$updatedCategory->user_id = $user->id;
		$updatedCategory->icon = 'briefcase';
		$updatedCategory->color = '#333333';
		$updatedCategory->name = 'Salary';
		$updatedCategory->type = 'income';
		$updatedCategory->total = 0;
		$updatedCategory->save();

		$transaction = new Transaction;
		$transaction->user_id = $user->id;
		$transaction->account_id = $originalAccount->id;
		$transaction->category_id = $originalCategory->id;
		$transaction->amount = 1000;
		$transaction->currency = 'KES';
		$transaction->notes = 'Lunch budget';
		$transaction->transaction_date = now()->subDays(2);
		$transaction->save();

		$response = $this->put(route('transactions.update', $transaction), [
			'category_id' => $updatedCategory->id,
			'account_id' => $updatedAccount->id,
			'amount' => 1500,
			'notes' => 'Updated salary',
			'transaction_date' => now()->toDateString(),
			'redirect_to' => '/transactions',
		]);

		$response->assertRedirect('/transactions')
			->assertInertiaFlash('toast.type', 'success')
			->assertInertiaFlash('toast.message', 'Transaction Updated Successfully');

		$transaction->refresh();
		$originalAccount->refresh();
		$updatedAccount->refresh();
		$originalCategory->refresh();
		$updatedCategory->refresh();

		$this->assertSame($updatedAccount->id, $transaction->account_id);
		$this->assertSame($updatedCategory->id, $transaction->category_id);
		$this->assertSame(1500, $transaction->amount);
		$this->assertSame('USD', $transaction->currency);
		$this->assertSame('Updated salary', $transaction->notes);
		$this->assertSame(5000, $originalAccount->balance);
		$this->assertSame(2000, $updatedAccount->balance);
		$this->assertSame(0, $originalCategory->total);
		$this->assertSame(1500, $updatedCategory->total);
	}

	public function test_destroy_deletes_transaction_and_reverses_balances(): void
	{
		$user = User::factory()->create();
		$this->actingAs($user);

		$account = new Account;
		$account->user_id = $user->id;
		$account->icon = 'wallet';
		$account->color = '#000000';
		$account->name = 'Cash';
		$account->currency = 'KES';
		$account->balance = 700;
		$account->save();

		$category = new Category;
		$category->user_id = $user->id;
		$category->icon = 'utensils';
		$category->color = '#000000';
		$category->name = 'Food';
		$category->type = 'expense';
		$category->total = 300;
		$category->save();

		$transaction = new Transaction;
		$transaction->user_id = $user->id;
		$transaction->account_id = $account->id;
		$transaction->category_id = $category->id;
		$transaction->amount = 300;
		$transaction->currency = 'KES';
		$transaction->notes = 'Lunch';
		$transaction->transaction_date = now()->toDateString();
		$transaction->save();

		$response = $this->delete(route('transactions.destroy', $transaction), [
			'redirect_to' => '/transactions',
		]);

		$response->assertRedirect('/transactions')
			->assertInertiaFlash('toast.type', 'success')
			->assertInertiaFlash('toast.message', 'Transaction Deleted Successfully');

		$this->assertDatabaseMissing('transactions', ['id' => $transaction->id]);

		$account->refresh();
		$category->refresh();

		$this->assertSame(1000, $account->balance);
		$this->assertSame(0, $category->total);
	}
}
