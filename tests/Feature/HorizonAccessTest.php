<?php

namespace Tests\Feature;

use App\Jobs\GenerateCategorySuggestions;
use App\Jobs\ProcessReceipt;
use App\Models\User;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HorizonAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The local environment bypasses the gate, so test as production.
        $this->app['env'] = 'production';
    }

    public function test_the_allowlisted_user_can_view_horizon(): void
    {
        $user = User::factory()->create(['email' => 'alphaxardgacuuru47@gmail.com']);

        $this->actingAs($user, 'web')->get('/horizon')->assertOk();
    }

    public function test_allowlist_matching_ignores_email_case(): void
    {
        $user = User::factory()->create(['email' => 'AlphaxardGacuuru47@Gmail.com']);

        $this->actingAs($user, 'web')->get('/horizon')->assertOk();
    }

    public function test_other_authenticated_users_cannot_view_horizon(): void
    {
        $user = User::factory()->create(['email' => 'someone@example.com']);

        $this->actingAs($user, 'web')->get('/horizon')->assertForbidden();
    }

    public function test_guests_cannot_view_horizon(): void
    {
        $this->get('/horizon')->assertForbidden();
    }

    public function test_a_bearer_token_alone_does_not_grant_access(): void
    {
        $user = User::factory()->create(['email' => 'alphaxardgacuuru47@gmail.com']);

        $this->withToken($user->createToken('web')->plainTextToken)
            ->get('/horizon')
            ->assertForbidden();
    }

    public function test_the_horizon_api_is_protected_too(): void
    {
        $this->getJson('/horizon/api/stats')->assertForbidden();
    }

    public function test_horizon_metrics_are_snapshotted_every_five_minutes(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->first(fn ($event): bool => str_contains((string) $event->command, 'horizon:snapshot'));

        $this->assertNotNull($event, 'horizon:snapshot is not scheduled.');
        $this->assertSame('*/5 * * * *', $event->expression);
    }

    public function test_the_redis_retry_window_outlasts_the_slowest_job(): void
    {
        $retryAfter = config('queue.connections.redis.retry_after');
        $supervisorTimeout = config('horizon.defaults.supervisor-1.timeout');
        $slowestJobTimeout = max(
            (new \ReflectionClass(ProcessReceipt::class))->getProperty('timeout')->getDefaultValue(),
            (new \ReflectionClass(GenerateCategorySuggestions::class))->getProperty('timeout')->getDefaultValue(),
        );

        $this->assertGreaterThan($slowestJobTimeout, $supervisorTimeout);
        $this->assertGreaterThan($supervisorTimeout, $retryAfter);
    }
}
