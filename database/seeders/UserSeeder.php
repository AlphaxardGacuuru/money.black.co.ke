<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed the application's users.
     */
    public function run(): void
    {
        User::factory(5)->create();

        User::query()->updateOrCreate(
            ['email' => 'alphaxardgacuuru47@gmail.com'],
            [
                'name' => 'Alphaxard Gacuuru',
                'email_verified_at' => now(),
                'password' => Hash::make('alphaxardgacuuru47@gmail.com'),
            ]
        );
    }
}
