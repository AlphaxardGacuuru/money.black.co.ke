<?php

namespace Database\Factories;

use App\Models\MonthlySummary;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MonthlySummary>
 */
class MonthlySummaryFactory extends Factory
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
            'period' => now()->subMonthNoOverflow()->format('Y-m'),
            'headline' => 'Spending up on groceries',
            'summary' => fake()->sentences(3, true),
            'stats' => ['expense' => 48200, 'income' => 90000],
        ];
    }
}
