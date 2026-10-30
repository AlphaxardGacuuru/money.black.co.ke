<?php

namespace Database\Factories;

use App\Models\AiUsage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AiUsage>
 */
class AiUsageFactory extends Factory
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
            'feature' => AiUsage::FEATURE_RECEIPT_SCAN,
            'provider' => 'gemini',
            'model' => 'gemini-3.1-flash-lite',
            'attempt' => 1,
            'input_tokens' => fake()->numberBetween(1000, 3000),
            'cached_input_tokens' => 0,
            'output_tokens' => fake()->numberBetween(100, 600),
            'reasoning_tokens' => 0,
            'cost_micros' => fake()->numberBetween(300, 1500),
        ];
    }

    /**
     * A monthly category review.
     */
    public function categoryReview(): static
    {
        return $this->state(fn (): array => ['feature' => AiUsage::FEATURE_CATEGORY_REVIEW, 'attempt' => null]);
    }
}
