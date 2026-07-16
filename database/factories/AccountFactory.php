<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
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
            'icon' => 'wallet',
            'color' => '#111827',
            'name' => fake()->unique()->word(),
            'currency' => 'KES',
            'type' => 'regular',
            'description' => fake()->optional()->sentence(),
            'is_default' => false,
            'balance' => 0,
        ];
    }

    /**
     * Indicate that the account is the user's default account.
     */
    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }
}
