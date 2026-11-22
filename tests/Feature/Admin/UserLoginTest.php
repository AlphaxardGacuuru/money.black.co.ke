<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserLogin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

/**
 * The logins page follows the Telescope gate.
 */
class UserLoginTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::factory()
            ->create();

        Gate::define('viewTelescope', fn (?User $user = null): bool => $user?->is($admin) ?? false);

        return $admin;
    }

    public function test_a_google_login_is_recorded(): void
    {
        $user = User::factory()
            ->create(['email' => 'google-user@example.com']);

        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-user-123');
        $googleUser->shouldReceive('getEmail')->andReturn('google-user@example.com');
        $googleUser->shouldReceive('getName')->andReturn($user->name);
        $googleUser->shouldReceive('getAvatar')->andReturn(null);

        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($googleUser);

        Socialite::shouldReceive('driver')
            ->with('google')
            ->andReturn($provider);

        $this->withHeader('User-Agent', 'Mozilla/5.0 (Linux; Android 14) Chrome/130.0')
            ->get('/login/google/callback')
            ->assertRedirect();

        $login = UserLogin::query()
            ->sole();

        $this->assertSame($user->id, $login->user_id);
        $this->assertSame(UserLogin::METHOD_GOOGLE, $login->method);
        $this->assertSame('127.0.0.1', $login->ip_address);
        $this->assertSame('Mozilla/5.0 (Linux; Android 14) Chrome/130.0', $login->user_agent);
        $this->assertNotNull($user->fresh()->last_active_at);
    }

    public function test_a_password_login_is_recorded(): void
    {
        $user = User::factory()
            ->create(['password' => Hash::make('secret-password')]);

        $this->postJson(route('login.store'), [
            'email' => $user->email,
            'password' => 'secret-password',
            'device_name' => 'test-device',
        ])
            ->assertOk();

        $this->assertDatabaseHas('user_logins', [
            'user_id' => $user->id,
            'method' => UserLogin::METHOD_PASSWORD,
        ]);
    }

    public function test_api_requests_mark_the_user_active_at_most_every_few_minutes(): void
    {
        $this->freezeSecond();

        $user = User::factory()
            ->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/auth')
            ->assertOk();

        $this->assertTrue($user->fresh()->last_active_at->eq(now()));

        $this->travel(User::ACTIVITY_INTERVAL_MINUTES - 1)->minutes();

        $this->actingAs($user->fresh(), 'sanctum')
            ->getJson('/api/auth')
            ->assertOk();

        $this->assertTrue($user->fresh()->last_active_at->eq(now()->subMinutes(User::ACTIVITY_INTERVAL_MINUTES - 1)));

        $this->travel(2)->minutes();

        $this->actingAs($user->fresh(), 'sanctum')
            ->getJson('/api/auth')
            ->assertOk();

        $this->assertTrue($user->fresh()->last_active_at->eq(now()));
    }

    public function test_admins_can_list_and_search_logins_and_see_active_users(): void
    {
        $jane = User::factory()
            ->create(['name' => 'Jane Wanjiru', 'last_active_at' => now()->subHours(2)]);
        $tom = User::factory()
            ->create(['name' => 'Tom Otieno', 'last_active_at' => now()->subDays(3)]);
        User::factory()
            ->create(['last_active_at' => now()->subDays(20)]);
        User::factory()
            ->create(['last_active_at' => now()->subDays(60)]);

        UserLogin::factory()
            ->for($jane)
            ->create(['created_at' => now()->subDay()]);
        UserLogin::factory()
            ->for($tom)
            ->create();

        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson(route('api.admin.user-logins.index'))
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.user.name', 'Tom Otieno')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.activeUsers', ['day' => 1, 'week' => 2, 'month' => 3])
            ->assertJsonCount(30, 'meta.daily')
            ->assertJsonPath('meta.daily.29', ['date' => now()->toDateString(), 'logins' => 1, 'users' => 1]);

        $this->actingAs($admin, 'sanctum')
            ->getJson(route('api.admin.user-logins.index', ['search' => 'jane']))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user.name', 'Jane Wanjiru');
    }

    public function test_only_admins_can_see_logins(): void
    {
        Gate::define('viewTelescope', fn (?User $user = null): bool => false);

        $this->getJson(route('api.admin.user-logins.index'))
            ->assertUnauthorized();

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson(route('api.admin.user-logins.index'))
            ->assertForbidden();
    }

    public function test_old_logins_are_pruned(): void
    {
        $old = UserLogin::factory()
            ->create(['created_at' => now()->subDays(UserLogin::RETENTION_DAYS + 1)]);
        $recent = UserLogin::factory()
            ->create();

        $this->artisan('model:prune', ['--model' => [UserLogin::class]])
            ->assertSuccessful();

        $this->assertModelMissing($old);
        $this->assertModelExists($recent);
    }
}
