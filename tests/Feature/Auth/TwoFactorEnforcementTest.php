<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\PasskeyConfirmationCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class TwoFactorEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_login_asks_for_the_two_factor_code_when_it_is_enabled(): void
    {
        $user = User::factory()->withTwoFactor()->create(['email' => 'secure@example.com']);
        $this->fakeGoogleUser('secure@example.com');

        $response = $this->get(route('login.google.callback', ['website' => 'google']));

        $response->assertRedirectContains('/two-factor-challenge?pending_token=');
        $this->assertStringNotContainsString('token=', str_replace('pending_token=', '', $response->headers->get('Location')));

        $this->assertGuest('web');
        $this->assertDatabaseCount('personal_access_tokens', 0);

        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertSame($user->id, Cache::get("2fa_pending:{$query['pending_token']}"));
    }

    public function test_google_login_completes_after_the_two_factor_code(): void
    {
        $user = User::factory()->withTwoFactor()->create(['email' => 'secure@example.com']);
        $this->fakeGoogleUser('secure@example.com');

        $location = $this->get(route('login.google.callback', ['website' => 'google']))->headers->get('Location');
        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

        $this->postJson(route('two-factor-challenge.store'), [
            'pending_token' => $query['pending_token'],
            'code' => $user->makeTwoFactorCode(),
        ])->assertOk()->assertJsonStructure(['data']);

        $this->assertAuthenticatedAs($user, 'web');
        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $user->id]);
    }

    public function test_google_login_without_two_factor_signs_in_straight_away(): void
    {
        $user = User::factory()->create(['email' => 'plain@example.com']);
        $this->fakeGoogleUser('plain@example.com');

        $this->get(route('login.google.callback', ['website' => 'google']))
            ->assertRedirectContains('/socialite-callback?token=');

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_turning_off_two_factor_requires_confirming_it_is_you(): void
    {
        $user = User::factory()->withTwoFactor()->create();
        $this->withToken($user->createToken('web')->plainTextToken);

        $this->postJson(route('two-factor.disable'))
            ->assertStatus(423)
            ->assertJson(['confirmation_required' => true, 'methods' => ['email']]);

        $this->assertTrue($user->fresh()->hasTwoFactorEnabled());
    }

    public function test_two_factor_can_be_turned_off_after_confirming_by_email(): void
    {
        Notification::fake();

        $user = User::factory()->withTwoFactor()->create();
        $this->withToken($user->createToken('web')->plainTextToken);

        $this->postJson(route('passkey.confirmation.email'))->assertOk();

        $code = null;
        Notification::assertSentTo($user, PasskeyConfirmationCodeNotification::class, function($notification) use (&$code): bool {
            $code = $notification->code;

            return true;
        });

        $this->postJson(route('passkey.confirmation.email.verify'), ['code' => $code])->assertOk();

        $this->postJson(route('two-factor.disable'))->assertOk();

        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());
    }

    public function test_the_login_page_sends_two_factor_users_to_the_registered_challenge_route(): void
    {
        $loginPage = file_get_contents(resource_path('js/pages/auth/login.tsx'));

        $this->assertStringContainsString('to: "/two-factor-challenge"', $loginPage);
        $this->assertStringNotContainsString('/auth/two-factor-challenge', $loginPage);
    }

    private function fakeGoogleUser(string $email): void
    {
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-' . md5($email));
        $googleUser->shouldReceive('getEmail')->andReturn($email);
        $googleUser->shouldReceive('getName')->andReturn('Google User');
        $googleUser->shouldReceive('getAvatar')->andReturn(null);

        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($googleUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
    }
}
