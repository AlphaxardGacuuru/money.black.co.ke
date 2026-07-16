<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered()
    {
        $response = $this->get(route('login'));

        $response->assertOk();
    }

    public function test_users_can_authenticate_using_the_login_screen()
    {
        $user = User::factory()->create();

        $response = $this->postJson(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'test-device',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Logged in']);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'test-device',
        ]);
    }

    public function test_login_requires_email_password_and_device_name()
    {
        $response = $this->postJson(route('login.store'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password', 'device_name']);
    }

    public function test_users_with_two_factor_enabled_receive_a_pending_challenge_token()
    {
        $user = User::factory()->withTwoFactor()->create();

        $response = $this->postJson(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'test-device',
        ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'Two-factor authentication required',
                'two_factor' => true,
            ]);

        $pendingToken = $response->json('data');

        $this->assertNotEmpty($pendingToken);
        $this->assertSame($user->id, Cache::get("2fa_pending:{$pendingToken}"));

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
    }

    public function test_users_can_not_authenticate_with_invalid_password()
    {
        $user = User::factory()->create();

        $response = $this->postJson(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
            'device_name' => 'test-device',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_users_can_not_authenticate_with_an_unknown_email()
    {
        $response = $this->postJson(route('login.store'), [
            'email' => 'unknown@example.com',
            'password' => 'password',
            'device_name' => 'test-device',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_users_can_logout()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('logout'));

        $this->assertGuest('web');
        $response->assertStatus(200);
        $response->assertJson(['message' => 'Logged Out']);
    }

    public function test_logout_without_an_authenticated_user_is_unauthorized()
    {
        $response = $this->postJson(route('logout'));

        $response->assertStatus(401);
    }
}
