<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use App\Support\AppLock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Passkeys\Actions\VerifyPasskey;
use Laravel\Passkeys\Passkey;
use Tests\TestCase;

class AppLockTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_the_app_lock_is_off_by_default(): void
    {
        $user = User::factory()->create();
        $this->createPasskeyFor($user);

        $this->signInWithToken($user);
        $this->travel(AppLock::IDLE_MINUTES + 1)->minutes();

        $this->getJson('/api/accounts')->assertOk();
        $this->getJson(route('api.auth.show'))->assertJson(['data' => ['app_lock_enabled' => false, 'app_locked' => false]]);
    }

    public function test_turning_on_the_app_lock_requires_a_passkey(): void
    {
        $user = User::factory()->create();

        $this->signInWithToken($user);

        $this->putJson(route('api.app-lock.update'), ['enabled' => true])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('enabled');

        $this->assertNull($user->fresh()->settings?->app_lock);
    }

    public function test_users_can_turn_the_app_lock_on_and_off(): void
    {
        $user = User::factory()->create();
        $this->createPasskeyFor($user);

        $this->signInWithToken($user);

        $this->putJson(route('api.app-lock.update'), ['enabled' => true])->assertOk();
        $this->assertTrue($user->fresh()->settings->app_lock);
        $this->getJson(route('api.auth.show'))->assertJson(['data' => ['app_lock_enabled' => true]]);

        $this->putJson(route('api.app-lock.update'), ['enabled' => false])->assertOk();
        $this->assertFalse($user->fresh()->settings->app_lock);
    }

    public function test_turning_on_the_app_lock_does_not_lock_an_old_token_straight_away(): void
    {
        $user = User::factory()->create();
        $this->createPasskeyFor($user);

        $this->signInWithToken($user);
        $this->travel(AppLock::IDLE_MINUTES + 1)->minutes();

        $this->putJson(route('api.app-lock.update'), ['enabled' => true])->assertOk();

        $this->getJson('/api/accounts')->assertOk();
    }

    public function test_a_new_sign_in_starts_unlocked(): void
    {
        $user = $this->userWithAppLock();

        $this->signInWithToken($user);

        $this->getJson('/api/accounts')->assertOk();
    }

    public function test_the_app_locks_after_a_day_idle(): void
    {
        $user = $this->userWithAppLock();

        $this->signInWithToken($user);
        $this->getJson('/api/accounts')->assertOk();

        $this->travel(AppLock::IDLE_MINUTES + 1)->minutes();

        $this->getJson('/api/accounts')
            ->assertStatus(423)
            ->assertJson(['app_locked' => true]);
        $this->getJson(route('api.auth.show'))
            ->assertOk()
            ->assertJson(['data' => ['app_locked' => true]]);
    }

    public function test_activity_keeps_the_app_unlocked(): void
    {
        $user = $this->userWithAppLock();

        $this->signInWithToken($user);

        $this->travel(AppLock::IDLE_MINUTES - 60)->minutes();
        $this->getJson('/api/accounts')->assertOk();

        $this->travel(AppLock::IDLE_MINUTES - 60)->minutes();
        $this->getJson('/api/accounts')->assertOk();
    }

    public function test_checking_the_lock_state_does_not_count_as_activity(): void
    {
        $user = $this->userWithAppLock();

        $this->signInWithToken($user);

        $this->travel(AppLock::IDLE_MINUTES - 60)->minutes();
        $this->getJson(route('api.auth.show'))->assertJson(['data' => ['app_locked' => false]]);

        $this->travel(120)->minutes();
        $this->getJson('/api/accounts')->assertStatus(423);
    }

    public function test_users_without_a_passkey_are_never_locked(): void
    {
        $user = $this->userWithAppLock();
        $user->passkeys()->delete();

        $this->signInWithToken($user);
        $this->travel(AppLock::IDLE_MINUTES + 1)->minutes();

        $this->getJson('/api/accounts')->assertOk();
    }

    public function test_a_passkey_unlocks_the_app(): void
    {
        $user = $this->userWithAppLock();
        $passkey = $user->passkeys()->first();

        $this->mock(VerifyPasskey::class)
            ->shouldReceive('__invoke')
            ->once()
            ->andReturn($passkey);

        $this->signInWithToken($user);
        $this->travel(AppLock::IDLE_MINUTES + 1)->minutes();
        $this->getJson('/api/accounts')->assertStatus(423);

        $this->getJson(route('passkey.confirmation.options'))->assertOk();
        $this->postJson(route('passkey.confirmation.store'), [
            'credential' => $this->fakeAssertionCredential(),
        ])->assertOk();

        $this->getJson('/api/accounts')->assertOk();
    }

    public function test_an_emailed_code_cannot_unlock_the_app(): void
    {
        $user = $this->userWithAppLock();

        $this->signInWithToken($user);
        $this->travel(AppLock::IDLE_MINUTES + 1)->minutes();

        $this->postJson(route('passkey.confirmation.email'))->assertStatus(423);
        $this->postJson(route('passkey.confirmation.email.verify'), ['code' => '123456'])->assertStatus(423);
    }

    public function test_unlocking_is_scoped_to_the_current_token(): void
    {
        $user = $this->userWithAppLock();

        $this->mock(VerifyPasskey::class)
            ->shouldReceive('__invoke')
            ->andReturn($user->passkeys()->first());

        $this->signInWithToken($user);
        $otherToken = $user->createToken('other')->plainTextToken;

        $this->travel(AppLock::IDLE_MINUTES + 1)->minutes();
        $this->getJson(route('passkey.confirmation.options'))->assertOk();
        $this->postJson(route('passkey.confirmation.store'), [
            'credential' => $this->fakeAssertionCredential(),
        ])->assertOk();
        $this->getJson('/api/accounts')->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withToken($otherToken)->getJson('/api/accounts')->assertStatus(423);
    }

    public function test_users_can_sign_out_while_locked(): void
    {
        $user = $this->userWithAppLock();

        $this->signInWithToken($user);
        $this->travel(AppLock::IDLE_MINUTES + 1)->minutes();

        $this->postJson(route('logout'))->assertOk();
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_settings_cannot_be_changed_while_locked(): void
    {
        $user = $this->userWithAppLock();

        $this->signInWithToken($user);
        $this->travel(AppLock::IDLE_MINUTES + 1)->minutes();

        $this->putJson(route('api.app-lock.update'), ['enabled' => false])->assertStatus(423);
        $this->patchJson(route('profile.update'), ['name' => 'New name', 'email' => $user->email])->assertStatus(423);
        $this->assertTrue($user->fresh()->settings->app_lock);
    }

    private function userWithAppLock(): User
    {
        $user = User::factory()->create(['settings' => ['app_lock' => true]]);
        $this->createPasskeyFor($user);

        return $user;
    }

    private function signInWithToken(User $user): void
    {
        $this->app['auth']->forgetGuards();

        $this->withToken($user->createToken('test')->plainTextToken);
    }

    private function createPasskeyFor(User $user): Passkey
    {
        return $user->passkeys()->create([
            'name' => 'My iPhone',
            'credential_id' => fake()->uuid(),
            'credential' => ['aaguid' => '00000000-0000-0000-0000-000000000000'],
        ]);
    }

    /**
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
                'authenticatorData' => $encode(str_repeat("\0", 32) . "\x05" . pack('N', 0)),
                'signature' => $encode(random_bytes(64)),
                'userHandle' => null,
            ],
        ];
    }
}
