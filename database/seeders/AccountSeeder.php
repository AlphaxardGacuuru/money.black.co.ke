<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\User;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
	/**
	 * Seed accounts for each user.
	 */
	public function run(): void
	{
		User::query()->select('id')->each(function (User $user): void {
			$accounts = [
				[
					'icon' => 'wallet',
					'color' => '#111827',
					'name' => 'Cash',
					'type' => 'cash',
					'description' => 'Physical cash account',
					'currency' => 'KES',
					'is_default' => true,
					'balance' => 0,
				],
				[
					'icon' => 'landmark',
					'color' => '#1d4ed8',
					'name' => 'Bank',
					'type' => 'bank',
					'description' => 'Primary bank account',
					'currency' => 'KES',
					'is_default' => false,
					'balance' => 0,
				],
			];

			foreach ($accounts as $account) {
				Account::query()->firstOrCreate(
					[
						'user_id' => $user->id,
						'name' => $account['name'],
					],
					$account
				);
			}
		});
	}
}
