<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
	/**
	 * Seed default categories for each user.
	 */
	public function run(): void
	{
		User::query()->select('id')->each(function (User $user): void {
			$categories = [
				[
					'name' => 'Salary',
					'type' => 'income',
					'icon' => 'briefcase',
					'color' => '#15803d'
				],
				[
					'name' => 'Freelance',
					'type' => 'income',
					'icon' => 'laptop',
					'color' => '#16a34a'
				],
				[
					'name' => 'Food',
					'type' => 'expense',
					'icon' => 'utensils',
					'color' => '#ea580c'
				],
				[
					'name' => 'Transport',
					'type' => 'expense',
					'icon' => 'car',
					'color' => '#2563eb'
				],
				[
					'name' => 'Utilities',
					'type' => 'expense',
					'icon' => 'bolt',
					'color' => '#7c3aed'
				],
				[
					'name' => 'Entertainment',
					'type' => 'expense',
					'icon' => 'film',
					'color' => '#db2777'
				],
			];

			foreach ($categories as $position => $category) {
				Category::query()->firstOrCreate(
					[
						'user_id' => $user->id,
						'name' => $category['name'],
					],
					[
						'icon' => $category['icon'],
						'color' => $category['color'],
						'type' => $category['type'],
						'position' => $position,
						'total' => 0,
					]
				);
			}
		});
	}
}
