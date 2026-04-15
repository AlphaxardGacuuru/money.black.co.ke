<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_exposes_google_login_when_configured(): void
    {
        config(['services.google.client_id' => 'google-client-id']);

        $response = $this->get(route('login'));

        $response->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component('auth/login')
                    ->where('canGoogleLogin', true)
                    ->where('googleLoginUrl', route('login.google.redirect'))
            );
    }

    public function test_users_can_be_redirected_to_google(): void
    {
        $provider = Mockery::mock();
        $provider->shouldReceive('redirect')
            ->once()
            ->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $response = $this->get(route('login.google.redirect'));

        $response->assertRedirect('https://accounts.google.com/o/oauth2/auth');
    }

    public function test_users_can_authenticate_with_google_and_have_their_account_created(): void
    {
        $provider = Mockery::mock();
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-user-123');
        $googleUser->shouldReceive('getEmail')->andReturn('google-user@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Google User');

        $provider->shouldReceive('user')
            ->once()
            ->andReturn($googleUser);

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $response = $this->get(route('login.google.callback'));

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'google-user@example.com',
            'google_id' => 'google-user-123',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false))
            ->assertInertiaFlash('toast.type', 'success')
            ->assertInertiaFlash('toast.message', 'Signed in with Google successfully.');
    }

    public function test_existing_users_are_linked_to_google_by_email(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'existing@example.com',
            'google_id' => null,
        ]);

        $provider = Mockery::mock();
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-user-456');
        $googleUser->shouldReceive('getEmail')->andReturn('existing@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Existing User');

        $provider->shouldReceive('user')
            ->once()
            ->andReturn($googleUser);

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $response = $this->get(route('login.google.callback'));

        $this->assertAuthenticatedAs($user->fresh());
        $this->assertSame('google-user-456', $user->fresh()->google_id);
        $this->assertNotNull($user->fresh()->email_verified_at);

        $response->assertRedirect(route('dashboard', absolute: false));
    }
}
