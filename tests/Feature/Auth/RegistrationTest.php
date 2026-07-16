<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->postJson(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'device_name' => 'test-device',
        ]);

        $response->assertOk()
            ->assertJson(['status' => 'success', 'message' => 'Registered Successfully']);

        $user = User::query()->where('email', 'test@example.com')->firstOrFail();

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'test-device',
        ]);
    }

    public function test_registration_requires_name_email_password_and_device_name()
    {
        $response = $this->postJson(route('register.store'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password', 'device_name']);
    }

    public function test_registration_requires_a_unique_email()
    {
        $user = User::factory()->create();

        $response = $this->postJson(route('register.store'), [
            'name' => 'Test User',
            'email' => $user->email,
            'password' => 'password',
            'password_confirmation' => 'password',
            'device_name' => 'test-device',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_registration_requires_matching_password_confirmation()
    {
        $response = $this->postJson(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'different-password',
            'device_name' => 'test-device',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }
}
