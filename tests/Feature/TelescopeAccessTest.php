<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Telescope\Telescope;
use Tests\TestCase;

class TelescopeAccessTest extends TestCase
{
    use RefreshDatabase;

    /**
     * phpunit.xml disables Telescope, which also skips registering its routes,
     * so it must be re-enabled before the application boots.
     */
    protected function setUp(): void
    {
        $this->setTelescopeEnabled('true');

        parent::setUp();

        Telescope::stopRecording();

        // The local environment bypasses the gate, so test as production.
        $this->app['env'] = 'production';

        config(['admin.dashboard_emails' => ['admin@example.com', 'ops@example.com']]);
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        $this->setTelescopeEnabled('false');
    }

    public function test_allowlisted_users_can_view_telescope(): void
    {
        $user = User::factory()->create(['email' => 'ops@example.com']);

        $this->actingAs($user, 'web')->get('/telescope')->assertOk();
    }

    public function test_other_authenticated_users_cannot_view_telescope(): void
    {
        $user = User::factory()->create(['email' => 'someone@example.com']);

        $this->actingAs($user, 'web')->get('/telescope')->assertForbidden();
    }

    public function test_guests_cannot_view_telescope(): void
    {
        $this->get('/telescope')->assertForbidden();
    }

    public function test_a_bearer_token_alone_does_not_grant_access(): void
    {
        $user = User::factory()->create(['email' => 'admin@example.com']);

        $this->withToken($user->createToken('web')->plainTextToken)
            ->get('/telescope')
            ->assertForbidden();
    }

    public function test_nobody_can_view_telescope_when_the_allowlist_is_empty(): void
    {
        config(['admin.dashboard_emails' => []]);

        $user = User::factory()->create(['email' => 'admin@example.com']);

        $this->actingAs($user, 'web')->get('/telescope')->assertForbidden();
    }

    private function setTelescopeEnabled(string $value): void
    {
        putenv("TELESCOPE_ENABLED={$value}");
        $_ENV['TELESCOPE_ENABLED'] = $value;
        $_SERVER['TELESCOPE_ENABLED'] = $value;
    }
}
