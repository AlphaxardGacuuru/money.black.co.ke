<?php

namespace Tests\Feature\Auth;

use App\Http\Middleware\UsePersistentAuthSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Fortify\Features;
use Symfony\Component\HttpFoundation\Cookie;
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

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false))
            ->assertInertiaFlash('toast.type', 'success')
            ->assertInertiaFlash('toast.message', 'Welcome back!');
    }

    public function test_remembered_logins_receive_a_persistent_auth_cookie_and_long_session_cookie()
    {
        $user = User::factory()->create();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'remember' => 'on',
        ]);

        $persistentCookie = $this->findCookie(
            $response->headers->getCookies(),
            UsePersistentAuthSession::COOKIE_NAME,
        );
        $sessionCookie = $this->findCookie(
            $response->headers->getCookies(),
            config('session.cookie'),
        );

        $this->assertNotNull($persistentCookie);
        $this->assertGreaterThan(now()->addYear()->timestamp, $persistentCookie->getExpiresTime());
        $this->assertNotNull($sessionCookie);
        $this->assertGreaterThan(now()->addYear()->timestamp, $sessionCookie->getExpiresTime());
    }

    public function test_non_remembered_logins_do_not_receive_a_persistent_auth_cookie()
    {
        $user = User::factory()->create();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $persistentCookie = $this->findCookie(
            $response->headers->getCookies(),
            UsePersistentAuthSession::COOKIE_NAME,
        );

        $this->assertNull($persistentCookie);
    }

    public function test_users_with_two_factor_enabled_are_redirected_to_two_factor_challenge()
    {
        $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

        Features::twoFactorAuthentication([
            'confirm' => true,
            'confirmPassword' => true,
        ]);

        $user = User::factory()->create();

        $user->forceFill([
            'two_factor_secret' => encrypt('test-secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
            'two_factor_confirmed_at' => now(),
        ])->save();

        $response = $this->post(route('login'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('two-factor.login'));
        $response->assertSessionHas('login.id', $user->id);
        $this->assertGuest();
    }

    public function test_users_can_not_authenticate_with_invalid_password()
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout()
    {
        $user = User::factory()->create();

        $response = $this->withCookie(UsePersistentAuthSession::COOKIE_NAME, '1')
            ->actingAs($user)
            ->post(route('logout'));

        $this->assertGuest();
        $response->assertRedirect(route('home'));

        $persistentCookie = $this->findCookie(
            $response->headers->getCookies(),
            UsePersistentAuthSession::COOKIE_NAME,
        );

        $this->assertNotNull($persistentCookie);
        $this->assertLessThanOrEqual(time(), $persistentCookie->getExpiresTime());
    }

    public function test_users_are_rate_limited()
    {
        $user = User::factory()->create();

        RateLimiter::increment(md5('login' . implode('|', [$user->email, '127.0.0.1'])), amount: 5);

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertTooManyRequests();
    }

    private function findCookie(array $cookies, string $name): ?Cookie
    {
        foreach ($cookies as $cookie) {
            if ($cookie->getName() === $name) {
                return $cookie;
            }
        }

        return null;
    }
}
