<?php

namespace Tests\Feature\Auth;

use App\Http\Controllers\Auth\PasskeyLoginController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Laravel\Passkeys\Actions\VerifyPasskey;
use Laravel\Passkeys\Passkey;
use Laravel\Passkeys\Passkeys;
use Tests\TestCase;

class PasskeyLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Passkeys::authorizeLoginUsing(null);

        parent::tearDown();
    }

    public function test_guests_can_request_passkey_login_options(): void
    {
        $response = $this->getJson(route('passkey.login-options'));

        $response->assertOk()
            ->assertJsonStructure(['options' => ['challenge', 'rpId'], 'challenge_token']);

        $this->assertNotNull(Cache::get(PasskeyLoginController::cacheKey($response->json('challenge_token'))));
    }

    public function test_users_can_log_in_with_a_valid_passkey(): void
    {
        $user = User::factory()->create();
        $passkey = $this->createPasskeyFor($user);

        $this->mock(VerifyPasskey::class)
            ->shouldReceive('__invoke')
            ->once()
            ->andReturn($passkey);

        $challengeToken = $this->getJson(route('passkey.login-options'))->json('challenge_token');

        $response = $this->postJson(route('passkey.login'), [
            'challenge_token' => $challengeToken,
            'device_name' => 'iPhone',
            'credential' => $this->fakeAssertionCredential(),
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Logged in'])
            ->assertJsonStructure(['data']);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'iPhone',
        ]);
    }

    public function test_passkey_login_bypasses_the_totp_challenge(): void
    {
        $user = User::factory()->withTwoFactor()->create();
        $passkey = $this->createPasskeyFor($user);

        $this->mock(VerifyPasskey::class)
            ->shouldReceive('__invoke')
            ->andReturn($passkey);

        $challengeToken = $this->getJson(route('passkey.login-options'))->json('challenge_token');

        $this->postJson(route('passkey.login'), [
            'challenge_token' => $challengeToken,
            'credential' => $this->fakeAssertionCredential(),
        ])->assertOk()->assertJsonMissing(['two_factor' => true]);
    }

    public function test_passkey_login_rejects_an_unregistered_credential(): void
    {
        $challengeToken = $this->getJson(route('passkey.login-options'))->json('challenge_token');

        $response = $this->postJson(route('passkey.login'), [
            'challenge_token' => $challengeToken,
            'credential' => $this->fakeAssertionCredential(),
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('credential');
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_passkey_login_rejects_an_unknown_or_expired_challenge(): void
    {
        $response = $this->postJson(route('passkey.login'), [
            'challenge_token' => 'not-a-real-token',
            'credential' => $this->fakeAssertionCredential(),
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('credential');
    }

    public function test_a_challenge_can_only_be_used_once(): void
    {
        $user = User::factory()->create();
        $passkey = $this->createPasskeyFor($user);

        $this->mock(VerifyPasskey::class)
            ->shouldReceive('__invoke')
            ->andReturn($passkey);

        $challengeToken = $this->getJson(route('passkey.login-options'))->json('challenge_token');
        $payload = ['challenge_token' => $challengeToken, 'credential' => $this->fakeAssertionCredential()];

        $this->postJson(route('passkey.login'), $payload)->assertOk();

        // Login starts a web session; end it so the replay reaches the challenge check rather than the guest middleware.
        Auth::guard('web')->logout();

        $this->postJson(route('passkey.login'), $payload)->assertUnprocessable();
    }

    public function test_passkey_login_requires_a_credential(): void
    {
        $this->postJson(route('passkey.login'), ['challenge_token' => 'abc'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['credential', 'credential.id', 'credential.rawId']);
    }

    public function test_passkey_login_honours_the_login_authorization_callback(): void
    {
        $user = User::factory()->create();
        $passkey = $this->createPasskeyFor($user);

        $this->mock(VerifyPasskey::class)
            ->shouldReceive('__invoke')
            ->andReturn($passkey);

        Passkeys::authorizeLoginUsing(fn (): bool => false);

        $challengeToken = $this->getJson(route('passkey.login-options'))->json('challenge_token');

        $this->postJson(route('passkey.login'), [
            'challenge_token' => $challengeToken,
            'credential' => $this->fakeAssertionCredential(),
        ])->assertUnprocessable();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_authenticated_users_cannot_request_login_options(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson(route('passkey.login-options'))
            ->assertRedirect();
    }

    private function createPasskeyFor(User $user): Passkey
    {
        return $user->passkeys()->create([
            'name' => 'Test device',
            'credential_id' => 'test-credential-id',
            'credential' => ['aaguid' => '00000000-0000-0000-0000-000000000000'],
        ]);
    }

    /**
     * A structurally valid WebAuthn assertion whose credential id is not registered.
     *
     * @return array<string, mixed>
     */
    private function fakeAssertionCredential(): array
    {
        $encode = fn (string $value): string => rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
        $rawId = $encode(random_bytes(16));

        return [
            'id' => $rawId,
            'rawId' => $rawId,
            'type' => 'public-key',
            'response' => [
                'clientDataJSON' => $encode(json_encode([
                    'type' => 'webauthn.get',
                    'challenge' => $encode(random_bytes(32)),
                    'origin' => config('app.url'),
                ])),
                // rpIdHash (32 bytes) + flags (UP|UV) + sign counter
                'authenticatorData' => $encode(str_repeat("\0", 32) . "\x05" . pack('N', 0)),
                'signature' => $encode(random_bytes(64)),
                'userHandle' => null,
            ],
        ];
    }
}
