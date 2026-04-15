<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Alphaxard Gacuuru',
            'email' => 'alphaxardgacuuru47@gmail.com',
            'email_verified_at' => now(),
            'password' => Hash::make('alphaxardgacuuru47@gmail.com'),
        ]);
    }
}
