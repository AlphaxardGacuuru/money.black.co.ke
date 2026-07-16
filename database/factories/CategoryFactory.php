<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
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
            'icon' => 'tags',
            'color' => '#1d4ed8',
            'name' => fake()->unique()->word(),
            'type' => fake()->randomElement(['expense', 'income']),
            'position' => 0,
            'total' => 0,
        ];
    }

    /**
     * Indicate that the category is an expense category.
     */
    public function expense(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'expense',
        ]);
    }

    /**
     * Indicate that the category is an income category.
     */
    public function income(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'income',
        ]);
    }
}
