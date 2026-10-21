<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passkeys\Actions\VerifyPasskey;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

/**
 * Every login path must start a `web` session (for session-gated dashboards
 * like Telescope) in addition to issuing the Sanctum token the SPA uses.
 */
class WebSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_login_starts_a_web_session(): void
    {
        $user = User::factory()->create(['email' => 'google-user@example.com']);

        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-user-123');
        $googleUser->shouldReceive('getEmail')->andReturn('google-user@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Google User');
        $googleUser->shouldReceive('getAvatar')->andReturn(null);

        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $this->get(route('login.google.callback', ['website' => 'google']))
            ->assertRedirectContains('/socialite-callback?token=');

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_password_login_starts_a_web_session(): void
    {
        $user = User::factory()->create();

        $this->postJson(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'web',
        ])->assertOk();

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_password_login_does_not_start_a_session_until_two_factor_is_completed(): void
    {
        $user = User::factory()->withTwoFactor()->create();

        $pendingToken = $this->postJson(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'web',
        ])->json('data');

        $this->assertGuest('web');

        $this->postJson(route('two-factor-challenge.store'), [
            'pending_token' => $pendingToken,
            'code' => $user->makeTwoFactorCode(),
        ])->assertOk();

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_passkey_login_starts_a_web_session(): void
    {
        $user = User::factory()->create();
        $passkey = $user->passkeys()->create([
            'name' => 'iPhone',
            'credential_id' => 'credential-id',
            'credential' => ['aaguid' => '00000000-0000-0000-0000-000000000000'],
        ]);

        $this->mock(VerifyPasskey::class)->shouldReceive('__invoke')->andReturn($passkey);

        $challengeToken = $this->getJson(route('passkey.login-options'))->json('challenge_token');
        $encode = fn (string $value): string => rtrim(strtr(base64_encode($value), '+/', '-_'), '=');

        $this->postJson(route('passkey.login'), [
            'challenge_token' => $challengeToken,
            'credential' => [
                'id' => $encode('credential-id'),
                'rawId' => $encode('credential-id'),
                'type' => 'public-key',
                'response' => [
                    'clientDataJSON' => $encode(json_encode(['type' => 'webauthn.get', 'challenge' => $encode('x'), 'origin' => config('app.url')])),
                    'authenticatorData' => $encode(str_repeat("\0", 32) . "\x05" . pack('N', 0)),
                    'signature' => $encode('signature'),
                    'userHandle' => null,
                ],
            ],
        ])->assertOk();

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_logout_deletes_the_token_and_ends_the_web_session(): void
    {
        $user = User::factory()->create();
        $plainTextToken = $user->createToken('web')->plainTextToken;
        $otherToken = $user->createToken('other-device');

        $this->actingAs($user, 'web')
            ->withToken($plainTextToken)
            ->postJson(route('logout'))
            ->assertOk();

        $this->assertGuest('web');
        $this->assertNull(PersonalAccessToken::findToken($plainTextToken));
        $this->assertNotNull(PersonalAccessToken::find($otherToken->accessToken->id));
    }

    public function test_logout_with_only_a_bearer_token_deletes_that_token(): void
    {
        $user = User::factory()->create();
        $plainTextToken = $user->createToken('web')->plainTextToken;

        $this->withToken($plainTextToken)->postJson(route('logout'))->assertOk();

        $this->assertNull(PersonalAccessToken::findToken($plainTextToken));
    }

    public function test_logout_ignores_a_bearer_token_belonging_to_another_user(): void
    {
        $user = User::factory()->create();
        $otherUsersToken = User::factory()->create()->createToken('web')->plainTextToken;

        $this->actingAs($user, 'web')
            ->withToken($otherUsersToken)
            ->postJson(route('logout'))
            ->assertOk();

        $this->assertNotNull(PersonalAccessToken::findToken($otherUsersToken));
    }
}
