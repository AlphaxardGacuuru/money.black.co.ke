<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'category_id' => fn (array $attributes) => Category::factory()->create([
                'user_id' => $attributes['user_id'],
            ])->id,
            'account_id' => fn (array $attributes) => Account::factory()->create([
                'user_id' => $attributes['user_id'],
            ])->id,
            'amount' => fake()->numberBetween(100, 10000),
            'currency' => 'KES',
            'notes' => fake()->optional()->sentence(),
            'transaction_date' => fake()->dateTimeBetween('-1 year'),
        ];
    }
}
