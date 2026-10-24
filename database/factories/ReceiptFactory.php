<?php

namespace Database\Factories;

use App\Models\Receipt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Receipt>
 */
class ReceiptFactory extends Factory
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
            'path' => 'receipts/' . Str::uuid() . '.jpg',
            'original_name' => 'receipt.jpg',
            'mime_type' => 'image/jpeg',
            'file_hash' => hash('sha256', Str::random(32)),
            'status' => Receipt::STATUS_PROCESSING,
            'currency' => 'KES',
        ];
    }

    /**
     * A receipt that has been read and is waiting for review.
     */
    public function review(): static
    {
        return $this->state(fn (): array => [
            'status' => Receipt::STATUS_REVIEW,
            'merchant' => fake()->company(),
            'receipt_date' => fake()->dateTimeBetween('-1 month')->format('Y-m-d'),
            'total' => fake()->numberBetween(100, 10000),
        ]);
    }

    /**
     * A receipt that could not be read.
     */
    public function failed(): static
    {
        return $this->state(fn (): array => [
            'status' => Receipt::STATUS_FAILED,
            'failure_reason' => 'The image could not be read.',
        ]);
    }

    /**
     * A receipt whose transactions have been created.
     */
    public function confirmed(): static
    {
        return $this->review()->state(fn (): array => [
            'status' => Receipt::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);
    }
}
