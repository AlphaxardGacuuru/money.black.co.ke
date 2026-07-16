<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

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

        $response = $this->get(route('login.google.redirect', ['website' => 'google']));

        $response->assertRedirect('https://accounts.google.com/o/oauth2/auth');
    }

    public function test_users_can_authenticate_with_google_and_have_their_account_created(): void
    {
        $provider = Mockery::mock();
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-user-123');
        $googleUser->shouldReceive('getEmail')->andReturn('google-user@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Google User');
        $googleUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/avatar');

        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $response = $this->get(route('login.google.callback', ['website' => 'google']));

        $this->assertDatabaseHas('users', [
            'email' => 'google-user@example.com',
            'google_id' => 'google-user-123',
            'avatar' => 'https://lh3.googleusercontent.com/a/avatar',
        ]);

        $user = User::query()->where('email', 'google-user@example.com')->firstOrFail();

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'web',
        ]);

        $response->assertRedirectContains('/socialite-callback?token=');
        $response->assertRedirectContains('provider=google');
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
        $googleUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/updated-avatar');

        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $response = $this->get(route('login.google.callback', ['website' => 'google']));

        $user->refresh();

        $this->assertSame('google-user-456', $user->google_id);
        $this->assertSame('https://lh3.googleusercontent.com/a/updated-avatar', $user->avatar);
        $this->assertNotNull($user->email_verified_at);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'web',
        ]);

        $response->assertRedirectContains('/socialite-callback?token=');
    }

    public function test_google_callback_failures_redirect_to_login_with_an_error(): void
    {
        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andThrow(new Exception('Google callback failed.'));

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($provider);

        $response = $this->get(route('login.google.callback', ['website' => 'google']));

        $response->assertRedirectContains('/login?error=');
    }
}
