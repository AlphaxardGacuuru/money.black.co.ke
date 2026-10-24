<?php

namespace Database\Factories;

use App\Models\CategorySuggestion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CategorySuggestion>
 */
class CategorySuggestionFactory extends Factory
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
            'category_id' => null,
            'action' => CategorySuggestion::ACTION_ADD,
            'name' => fake()->unique()->words(2, true),
            'type' => 'expense',
            'icon' => 'Tags',
            'color' => '#2563eb',
            'reason' => fake()->sentence(),
            'status' => CategorySuggestion::STATUS_PENDING,
            'period' => now()->subMonth()->format('Y-m'),
        ];
    }

    /**
     * A suggestion to rename an existing category.
     */
    public function rename(): static
    {
        return $this->state(fn (): array => ['action' => CategorySuggestion::ACTION_RENAME]);
    }

    public function dismissed(): static
    {
        return $this->state(fn (): array => [
            'status' => CategorySuggestion::STATUS_DISMISSED,
            'resolved_at' => now(),
        ]);
    }
}
