<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The sidebar's Admin menu shows Telescope/Horizon/Pulse links based on these flags,
 * which come from the same gates that protect the dashboards.
 */
class AdminDashboardLinksTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_admin_can_see_both_dashboards(): void
    {
        config(['telescope.enabled' => true]);

        $admin = User::factory()->create(['email' => 'alphaxardgacuuru47@gmail.com']);

        $this->actingAs($admin)->getJson(route('api.auth.show'))
            ->assertOk()
            ->assertJsonPath('data.can_view_telescope', true)
            ->assertJsonPath('data.can_view_horizon', true)
            ->assertJsonPath('data.can_view_pulse', true);
    }

    public function test_other_users_see_neither_dashboard(): void
    {
        config(['telescope.enabled' => true]);

        $user = User::factory()->create(['email' => 'someone@example.com']);

        $this->actingAs($user)->getJson(route('api.auth.show'))
            ->assertOk()
            ->assertJsonPath('data.can_view_telescope', false)
            ->assertJsonPath('data.can_view_horizon', false)
            ->assertJsonPath('data.can_view_pulse', false);
    }

    public function test_the_telescope_link_is_hidden_when_telescope_is_disabled(): void
    {
        config(['telescope.enabled' => false]);

        $admin = User::factory()->create(['email' => 'alphaxardgacuuru47@gmail.com']);

        $this->actingAs($admin)->getJson(route('api.auth.show'))
            ->assertJsonPath('data.can_view_telescope', false)
            ->assertJsonPath('data.can_view_horizon', true);
    }

    public function test_the_flags_match_the_dashboard_gates(): void
    {
        $this->app['env'] = 'production';
        config(['telescope.enabled' => true]);

        $admin = User::factory()->create(['email' => 'alphaxardgacuuru47@gmail.com']);
        $user = User::factory()->create();

        $this->actingAs($admin, 'web')->get('/horizon')->assertOk();
        $this->actingAs($user, 'web')->get('/horizon')->assertForbidden();
    }
}
