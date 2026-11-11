<?php

namespace Tests\Feature;

use App\Models\MonthlySummary;
use App\Models\User;
use App\Notifications\AdminNewUserSignupNotification;
use App\Notifications\CategorySuggestionsReady;
use App\Notifications\Messages\WebPushMessage;
use App\Notifications\MonthlySummaryReady;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Tests\TestCase;

class PushActionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // No notification has a background button yet, so signedAction() is
        // checked against a stand-in route set up like gallery's push-actions.
        Route::prefix('api/push-actions/{user}')
            ->middleware(['api', 'signed:relative', 'throttle:30,1'])
            ->group(fn () => Route::post('ping', fn (User $user) => response()->json(['message' => "Pong {$user->name}"]))
                ->name('push-actions.ping'));

        Route::getRoutes()
            ->refreshNameLookups();
    }

    /**
     * The web push payload a notification would send $notifiable.
     *
     * @return array<string, mixed>
     */
    private function push(object $notification, User $notifiable): array
    {
        return $notification
            ->toWebPush($notifiable, $notification)
            ->toArray();
    }

    /**
     * The page each button opens, keyed by its action name.
     *
     * @param  array<string, mixed>  $push
     * @return array<string, string>
     */
    private function buttons(array $push): array
    {
        return collect($push['actions'])
            ->mapWithKeys(fn (array $action) => [$action['action'] => $push['data']['actions'][$action['action']]['url']])
            ->all();
    }

    /**
     * Whether $url is a page in the SPA, i.e. resources/js/pages has a
     * matching <path>.tsx or <path>/index.tsx (see router/page-routes.ts).
     */
    private function assertIsPage(string $url): void
    {
        $path = Str::of($url)
            ->before('?')
            ->trim('/')
            ->toString();

        $this->assertTrue(
            collect([resource_path("js/pages/{$path}.tsx"), resource_path("js/pages/{$path}/index.tsx")])
                ->contains(fn (string $file) => file_exists($file)),
            "No page for {$url}"
        );
    }

    public function test_the_monthly_summary_opens_that_month_or_the_transactions(): void
    {
        $user = User::factory()->create();
        $summary = MonthlySummary::factory()
            ->for($user)
            ->create(['period' => '2026-10']);

        $push = $this->push(new MonthlySummaryReady($summary), $user);

        $this->assertSame(['summary' => '/overview?month=2026-10', 'transactions' => '/transactions'], $this->buttons($push));
        $this->assertSame('/overview?month=2026-10', $push['data']['url']);
    }

    public function test_the_category_check_in_opens_the_ideas_or_the_categories(): void
    {
        $user = User::factory()->create();

        $push = $this->push(new CategorySuggestionsReady(['Add a "Fuel" category'], '2026-10'), $user);

        $this->assertSame(['review' => '/category-suggestions', 'categories' => '/categories'], $this->buttons($push));
        $this->assertSame('/category-suggestions', $push['data']['url']);
    }

    public function test_the_admin_signup_alert_opens_ai_usage(): void
    {
        $admin = User::factory()->create(['email' => config('admin.email')]);

        $push = $this->push(new AdminNewUserSignupNotification(User::factory()->create()), $admin);

        $this->assertSame(['ai-usage' => '/admin/ai-usage'], $this->buttons($push));
        $this->assertSame('/overview', $push['data']['url']);
    }

    public function test_every_button_opens_a_page_that_exists(): void
    {
        $user = User::factory()->create();
        $summary = MonthlySummary::factory()
            ->for($user)
            ->create();

        collect([
            new MonthlySummaryReady($summary),
            new CategorySuggestionsReady(['Add a "Fuel" category'], '2026-10'),
            new AdminNewUserSignupNotification(User::factory()->create()),
        ])
            ->map(fn (object $notification) => $this->push($notification, $user))
            ->flatMap(fn (array $push) => [$push['data']['url'], ...array_values($this->buttons($push))])
            ->each(fn (string $url) => $this->assertIsPage($url));
    }

    public function test_a_signed_action_posts_to_a_short_lived_relative_link(): void
    {
        $user = User::factory()->create(['name' => 'Wanjiku']);

        $push = (new WebPushMessage)
            ->signedAction('ping', 'Ping', 'push-actions.ping', ['user' => $user->id])
            ->data(['url' => '/overview'])
            ->toArray();

        $link = $push['data']['actions']['ping']['post'];

        $this->assertSame([['title' => 'Ping', 'action' => 'ping']], $push['actions']);
        $this->assertSame('/overview', $push['data']['url']);
        $this->assertStringStartsWith("/api/push-actions/{$user->id}/ping?expires=", $link);

        $this->postJson($link)
            ->assertOk()
            ->assertJson(['message' => 'Pong Wanjiku']);

        $this->travel(WebPushMessage::SIGNED_ACTION_LIFETIME_DAYS)
            ->days();
        $this->travel(1)
            ->minutes();

        $this->postJson($link)
            ->assertForbidden();
    }

    public function test_a_push_action_needs_a_valid_unexpired_signature(): void
    {
        $user = User::factory()->create();

        $this->postJson("/api/push-actions/{$user->id}/ping")
            ->assertForbidden();

        $expired = URL::temporarySignedRoute('push-actions.ping', now()->subMinute(), ['user' => $user->id], absolute: false);

        $this->postJson($expired)
            ->assertForbidden();
    }

    public function test_a_signed_link_only_works_for_the_user_it_was_sent_to(): void
    {
        $user = User::factory()->create();
        $someoneElse = User::factory()->create();

        $link = URL::temporarySignedRoute('push-actions.ping', now()->addDay(), ['user' => $user->id], absolute: false);

        $this->postJson(Str::replace("/push-actions/{$user->id}/", "/push-actions/{$someoneElse->id}/", $link))
            ->assertForbidden();
    }

    public function test_every_web_push_notification_has_a_button(): void
    {
        collect(glob(app_path('Notifications/*.php')))
            ->map(fn (string $path) => file_get_contents($path))
            ->filter(fn (string $source) => str_contains($source, 'function toWebPush'))
            ->each(fn (string $source) => $this->assertMatchesRegularExpression('/->(openAction|signedAction)\(/', $source));
    }
}
