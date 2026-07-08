<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
	/**
	 * Seed transactions from the beginning of the year to now.
	 */
	public function run(): void
	{
		$startOfYear = CarbonImmutable::now()->startOfYear();
		$now = CarbonImmutable::now();

		User::query()->select('id')->each(function (User $user) use ($startOfYear, $now): void {
			$accounts = Account::query()->where('user_id', $user->id)->get();
			$categories = Category::query()->where('user_id', $user->id)->get();

			if ($accounts->isEmpty() || $categories->isEmpty()) {
				return;
			}

			$accounts->each(function (Account $account): void {
				$account->update(['balance' => 0]);
			});

			$categories->each(function (Category $category): void {
				$category->update(['total' => 0]);
			});

			$transactionCount = random_int(30, 60);

			for ($index = 0; $index < $transactionCount; $index++) {
				/** @var Account $account */
				$account = $accounts->random();
				/** @var Category $category */
				$category = $categories->random();

				$amount = random_int(100, 50000);
				$transactionDate = fake()->dateTimeBetween(
					$startOfYear->format('Y-m-d H:i:s'),
					$now->format('Y-m-d H:i:s')
				);

				Transaction::query()->create([
					'user_id' => $user->id,
					'category_id' => $category->id,
					'account_id' => $account->id,
					'amount' => $amount,
					'currency' => $account->currency,
					'notes' => fake()->optional(0.7)->sentence(4),
					'transaction_date' => $transactionDate,
				]);

				if ($category->type === 'income') {
					$account->increment('balance', $amount);
				} else {
					$account->decrement('balance', $amount);
				}

				$category->increment('total', $amount);
			}
		});
	}
}
