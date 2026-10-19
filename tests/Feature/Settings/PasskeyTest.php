<?php

namespace Tests\Feature\Settings;

use App\Http\Controllers\Settings\PasskeyController;
use App\Models\User;
use App\Notifications\PasskeyConfirmationCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Laravel\Passkeys\Actions\StorePasskey;
use Laravel\Passkeys\Actions\VerifyPasskey;
use Laravel\Passkeys\Passkey;
use Tests\TestCase;

class PasskeyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_guests_cannot_manage_passkeys(): void
    {
        $this->getJson(route('passkey.index'))->assertUnauthorized();
        $this->getJson(route('passkey.registration-options'))->assertUnauthorized();
        $this->postJson(route('passkey.store'))->assertUnauthorized();
        $this->postJson(route('passkey.confirmation.email'))->assertUnauthorized();
    }

    public function test_users_can_list_their_own_passkeys_without_confirming(): void
    {
        $user = User::factory()->create();
        $this->createPasskeyFor($user, 'My iPhone');
        $this->createPasskeyFor(User::factory()->create(), 'Someone else');

        $this->signInWithToken($user);

        $this->getJson(route('passkey.index'))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'My iPhone');
    }

    public function test_managing_passkeys_requires_confirmation(): void
    {
        $user = User::factory()->create();
        $passkey = $this->createPasskeyFor($user, 'Old phone');

        $this->signInWithToken($user);

        $this->getJson(route('passkey.registration-options'))
            ->assertStatus(423)
            ->assertJson(['confirmation_required' => true, 'methods' => ['passkey', 'email']]);

        $this->postJson(route('passkey.store'), ['name' => 'x'])->assertStatus(423);
        $this->deleteJson(route('passkey.destroy', $passkey))->assertStatus(423);

        $this->assertDatabaseHas('passkeys', ['id' => $passkey->id]);
    }

    public function test_only_email_confirmation_is_offered_when_the_user_has_no_passkeys(): void
    {
        $this->signInWithToken(User::factory()->create());

        $this->getJson(route('passkey.registration-options'))
            ->assertStatus(423)
            ->assertJsonPath('methods', ['email']);

        $this->getJson(route('passkey.confirmation.show'))
            ->assertOk()
            ->assertJson(['confirmed' => false, 'methods' => ['email']]);
    }

    public function test_confirmation_status_masks_the_email_address(): void
    {
        $this->signInWithToken(User::factory()->create(['email' => 'alphaxard@gmail.com']));

        $this->getJson(route('passkey.confirmation.show'))
            ->assertJsonPath('email', 'a********@gmail.com');
    }

    public function test_users_can_confirm_with_an_emailed_code(): void
    {
        $user = User::factory()->create();

        $this->signInWithToken($user);
        $this->confirmIdentityByEmail($user);

        $this->getJson(route('passkey.confirmation.show'))->assertJson(['confirmed' => true]);
        $this->getJson(route('passkey.registration-options'))->assertOk();
    }

    public function test_an_incorrect_email_code_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->signInWithToken($user);
        $this->postJson(route('passkey.confirmation.email'))->assertOk();

        $this->postJson(route('passkey.confirmation.email.verify'), ['code' => $this->wrongCodeFor($user)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');

        $this->getJson(route('passkey.registration-options'))->assertStatus(423);
    }

    public function test_email_codes_are_invalidated_after_too_many_attempts(): void
    {
        $user = User::factory()->create();

        $this->signInWithToken($user);
        $this->postJson(route('passkey.confirmation.email'))->assertOk();

        $wrongCode = $this->wrongCodeFor($user);
        $correctCode = $this->sentCodeFor($user);

        foreach (range(1, 4) as $attempt) {
            $this->postJson(route('passkey.confirmation.email.verify'), ['code' => $wrongCode])
                ->assertJsonPath('errors.code.0', 'The code you entered is incorrect.');
        }

        $this->postJson(route('passkey.confirmation.email.verify'), ['code' => $wrongCode])
            ->assertJsonPath('errors.code.0', 'Too many incorrect attempts. Please request a new code.');

        $this->postJson(route('passkey.confirmation.email.verify'), ['code' => $correctCode])
            ->assertUnprocessable()
            ->assertJsonPath('errors.code.0', 'This code has expired. Please request a new one.');
    }

    public function test_email_code_requires_a_request_first(): void
    {
        $this->signInWithToken(User::factory()->create());

        $this->postJson(route('passkey.confirmation.email.verify'), ['code' => '123456'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
    }

    public function test_users_can_confirm_with_an_existing_passkey(): void
    {
        $user = User::factory()->create();
        $passkey = $this->createPasskeyFor($user, 'My iPhone');

        $this->mock(VerifyPasskey::class)
            ->shouldReceive('__invoke')
            ->once()
            ->withArgs(fn ($credential, $options, $owner): bool => $owner->is($user))
            ->andReturn($passkey);

        $this->signInWithToken($user);

        $this->getJson(route('passkey.confirmation.options'))
            ->assertOk()
            ->assertJsonStructure(['options' => ['challenge', 'allowCredentials']]);

        $this->postJson(route('passkey.confirmation.store'), [
            'credential' => $this->fakeAssertionCredential(),
        ])->assertOk();

        $this->getJson(route('passkey.registration-options'))->assertOk();
    }

    public function test_passkey_confirmation_options_require_an_existing_passkey(): void
    {
        $this->signInWithToken(User::factory()->create());

        $this->getJson(route('passkey.confirmation.options'))->assertUnprocessable();
    }

    public function test_passkey_confirmation_rejects_another_users_passkey(): void
    {
        $user = User::factory()->create();
        $this->createPasskeyFor($user, 'Mine');
        $other = $this->createPasskeyFor(User::factory()->create(), 'Theirs');
        $other->forceFill(['credential_id' => 'their-credential'])->save();

        $this->signInWithToken($user);
        $this->getJson(route('passkey.confirmation.options'))->assertOk();

        $credential = $this->fakeAssertionCredential(rawId: 'their-credential');

        $this->postJson(route('passkey.confirmation.store'), ['credential' => $credential])
            ->assertUnprocessable();

        $this->getJson(route('passkey.registration-options'))->assertStatus(423);
    }

    public function test_confirmation_is_scoped_to_the_current_token(): void
    {
        $user = User::factory()->create();

        $this->signInWithToken($user);
        $this->confirmIdentityByEmail($user);
        $this->getJson(route('passkey.registration-options'))->assertOk();

        $this->signInWithToken($user);
        $this->getJson(route('passkey.registration-options'))->assertStatus(423);
    }

    public function test_confirmation_expires(): void
    {
        $user = User::factory()->create();

        $this->signInWithToken($user);
        $this->confirmIdentityByEmail($user);

        $this->travel(11)->minutes();

        $this->getJson(route('passkey.registration-options'))->assertStatus(423);
    }

    public function test_users_can_request_registration_options_once_confirmed(): void
    {
        $user = User::factory()->create();

        $this->signInWithToken($user);
        $this->confirmIdentityByEmail($user);

        $this->getJson(route('passkey.registration-options'))
            ->assertOk()
            ->assertJsonStructure(['options' => ['challenge', 'rp', 'user', 'pubKeyCredParams']])
            ->assertJsonPath('options.user.name', $user->email);

        $this->assertNotNull(Cache::get(PasskeyController::cacheKey($user)));
    }

    public function test_users_can_register_a_passkey(): void
    {
        $user = User::factory()->create();

        $this->mock(StorePasskey::class)
            ->shouldReceive('__invoke')
            ->once()
            ->andReturnUsing(fn (User $owner, string $name): Passkey => $this->createPasskeyFor($owner, $name));

        $this->signInWithToken($user);
        $this->confirmIdentityByEmail($user);

        $this->getJson(route('passkey.registration-options'))->assertOk();

        $this->postJson(route('passkey.store'), [
            'name' => 'Pixel 9',
            'credential' => $this->fakeAttestationCredential(),
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Pixel 9');

        $this->assertDatabaseHas('passkeys', ['user_id' => $user->id, 'name' => 'Pixel 9']);
        $this->assertNull(Cache::get(PasskeyController::cacheKey($user)));
    }

    public function test_registering_without_requesting_options_fails(): void
    {
        $user = User::factory()->create();

        $this->signInWithToken($user);
        $this->confirmIdentityByEmail($user);

        $this->postJson(route('passkey.store'), [
            'name' => 'Pixel 9',
            'credential' => $this->fakeAttestationCredential(),
        ])->assertUnprocessable()->assertJsonValidationErrors('credential');
    }

    public function test_registering_requires_a_name(): void
    {
        $user = User::factory()->create();

        $this->signInWithToken($user);
        $this->confirmIdentityByEmail($user);

        $this->postJson(route('passkey.store'), [
            'credential' => $this->fakeAttestationCredential(),
        ])->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    public function test_users_can_delete_their_passkey(): void
    {
        $user = User::factory()->create();
        $passkey = $this->createPasskeyFor($user, 'Old phone');

        $this->signInWithToken($user);
        $this->confirmIdentityByEmail($user);

        $this->deleteJson(route('passkey.destroy', $passkey))->assertOk();

        $this->assertDatabaseMissing('passkeys', ['id' => $passkey->id]);
    }

    public function test_users_cannot_delete_another_users_passkey(): void
    {
        $user = User::factory()->create();
        $passkey = $this->createPasskeyFor(User::factory()->create(), 'Not yours');

        $this->signInWithToken($user);
        $this->confirmIdentityByEmail($user);

        $this->deleteJson(route('passkey.destroy', $passkey))->assertForbidden();

        $this->assertDatabaseHas('passkeys', ['id' => $passkey->id]);
    }

    /**
     * Authenticate subsequent requests with a fresh, real Sanctum token.
     */
    private function signInWithToken(User $user): void
    {
        $this->app['auth']->forgetGuards();

        $this->withToken($user->createToken('test')->plainTextToken);
    }

    private function confirmIdentityByEmail(User $user): void
    {
        $this->postJson(route('passkey.confirmation.email'))->assertOk();

        $this->postJson(route('passkey.confirmation.email.verify'), ['code' => $this->sentCodeFor($user)])
            ->assertOk();
    }

    private function sentCodeFor(User $user): string
    {
        $code = null;

        Notification::assertSentTo($user, PasskeyConfirmationCodeNotification::class, function($notification) use (&$code): bool {
            $code = $notification->code;

            return true;
        });

        return $code;
    }

    private function wrongCodeFor(User $user): string
    {
        return str_pad((string) (((int) $this->sentCodeFor($user) + 1) % 1000000), 6, '0', STR_PAD_LEFT);
    }

    private function createPasskeyFor(User $user, string $name): Passkey
    {
        return $user->passkeys()->create([
            'name' => $name,
            'credential_id' => fake()->uuid(),
            'credential' => ['aaguid' => '00000000-0000-0000-0000-000000000000'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function fakeAssertionCredential(?string $rawId = null): array
    {
        $encode = fn (string $value): string => rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
        $rawId = $rawId === null ? $encode(random_bytes(16)) : $encode($rawId);

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
                'authenticatorData' => $encode(str_repeat("\0", 32) . "\x05" . pack('N', 0)),
                'signature' => $encode(random_bytes(64)),
                'userHandle' => null,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function fakeAttestationCredential(): array
    {
        $encode = fn (string $value): string => rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
        $rawId = $encode(random_bytes(16));

        return [
            'id' => $rawId,
            'rawId' => $rawId,
            'type' => 'public-key',
            'response' => [
                'clientDataJSON' => $encode(json_encode([
                    'type' => 'webauthn.create',
                    'challenge' => $encode(random_bytes(32)),
                    'origin' => config('app.url'),
                ])),
                // CBOR map: {"fmt": "none", "attStmt": {}, "authData": <37 bytes: rpIdHash + flags + counter>}
                'attestationObject' => $encode(
                    hex2bin('a363666d74646e6f6e656761747453746d74a06861757468446174615825')
                    . str_repeat("\0", 32) . "\x05" . pack('N', 0)
                ),
            ],
        ];
    }
}
