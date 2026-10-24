<?php

namespace Database\Factories;

use App\Models\Receipt;
use App\Models\ReceiptItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReceiptItem>
 */
class ReceiptItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'receipt_id' => Receipt::factory()->review(),
            'category_id' => null,
            'description' => fake()->words(2, true),
            'quantity' => 1,
            'amount' => fake()->numberBetween(50, 2000),
            'position' => 0,
        ];
    }
}
