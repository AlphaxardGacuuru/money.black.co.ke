<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TwoFactorChallengeTest extends TestCase
{
    use RefreshDatabase;

    public function test_two_factor_challenge_screen_can_be_rendered(): void
    {
        $response = $this->get(route('two-factor.login'));

        $response->assertOk();
    }

    public function test_users_can_complete_the_two_factor_challenge_with_a_valid_code(): void
    {
        $user = User::factory()->withTwoFactor()->create();

        $login = $this->postJson(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'test-device',
        ]);

        $pendingToken = $login->json('data');

        $response = $this->postJson(route('two-factor-challenge.store'), [
            'pending_token' => $pendingToken,
            'code' => $user->makeTwoFactorCode(),
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Logged in']);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'web',
        ]);
    }

    public function test_two_factor_challenge_rejects_an_invalid_code(): void
    {
        $user = User::factory()->withTwoFactor()->create();

        $login = $this->postJson(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'test-device',
        ]);

        $pendingToken = $login->json('data');

        $response = $this->postJson(route('two-factor-challenge.store'), [
            'pending_token' => $pendingToken,
            'code' => '000000',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('code');
    }

    public function test_two_factor_challenge_rejects_an_unknown_pending_token(): void
    {
        $response = $this->postJson(route('two-factor-challenge.store'), [
            'pending_token' => 'not-a-real-token',
            'code' => '123456',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('pending_token');
    }
}
