<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
