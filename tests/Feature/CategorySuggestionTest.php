<?php

namespace Tests\Feature;

use App\Ai\Agents\CategoryAdvisor;
use App\Http\Services\CategorySuggestionService;
use App\Jobs\GenerateCategorySuggestions;
use App\Models\Category;
use App\Models\CategorySuggestion;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\CategorySuggestionsReady;
use App\Support\CategoryCatalog;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Laravel\Ai\Prompts\AgentPrompt;
use Tests\TestCase;

class CategorySuggestionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

        $this->withHeaders(['X-Requested-With' => 'XMLHttpRequest']);
    }

    public function test_guests_cannot_use_category_suggestions(): void
    {
        $this->getJson(route('api.category-suggestions.index'))->assertUnauthorized();
        $this->postJson(route('api.category-suggestions.starter'))->assertUnauthorized();
    }

    public function test_it_lists_the_starter_set_and_only_the_users_pending_suggestions(): void
    {
        $user = User::factory()->create();
        CategorySuggestion::factory()->for($user)->create(['name' => 'Fuel']);
        CategorySuggestion::factory()->for($user)->dismissed()->create(['name' => 'Gym']);
        CategorySuggestion::factory()->create(['name' => 'Not Mine']);

        $this->actingAs($user)->getJson(route('api.category-suggestions.index'))
            ->assertOk()
            ->assertJsonCount(count(CategoryCatalog::STARTER), 'starter')
            ->assertJsonCount(1, 'suggestions')
            ->assertJsonPath('suggestions.0.name', 'Fuel');
    }

    public function test_users_can_create_starter_categories(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson(route('api.category-suggestions.starter'), [
            'names' => ['Food & Groceries', 'Transport', 'Salary'],
        ])->assertCreated()->assertJsonPath('message', 'Added 3 categories.');

        $categories = Category::query()->where('user_id', $user->id)->orderBy('position')->get();

        $this->assertSame(['Food & Groceries', 'Transport', 'Salary'], $categories->pluck('name')->all());
        $this->assertSame([1, 2, 3], $categories->pluck('position')->all());
        $this->assertSame(['ShoppingCart', 'Bus', 'Briefcase'], $categories->pluck('icon')->all());
        $this->assertSame(['expense', 'expense', 'income'], $categories->pluck('type')->all());
    }

    public function test_starter_categories_skip_names_the_user_already_has(): void
    {
        $user = User::factory()->create();
        Category::factory()->for($user)->create(['name' => 'transport', 'position' => 1]);

        $this->actingAs($user)->postJson(route('api.category-suggestions.starter'), [
            'names' => ['Transport', 'Rent'],
        ])->assertCreated()->assertJsonPath('message', 'Added 1 category.');

        $this->assertSame(2, Category::query()->where('user_id', $user->id)->count());
        $this->assertDatabaseHas('categories', ['user_id' => $user->id, 'name' => 'Rent', 'position' => 2]);
    }

    public function test_only_catalog_names_can_be_used_as_starter_categories(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson(route('api.category-suggestions.starter'), [
            'names' => ['Something Made Up'],
        ])->assertUnprocessable()->assertJsonValidationErrors('names.0');

        $this->assertDatabaseCount('categories', 0);
    }

    public function test_every_starter_and_suggestion_icon_is_one_the_app_can_display(): void
    {
        foreach (CategoryCatalog::STARTER as $preset) {
            $this->assertContains($preset['icon'], CategoryCatalog::ICONS, "{$preset['name']} uses an icon outside the allowed list.");
            $this->assertMatchesRegularExpression('/^[A-Z][A-Za-z0-9]+$/', $preset['icon'], 'Icons must be lucide-react component names.');
        }
    }

    public function test_users_with_too_few_transactions_are_not_sent_to_the_ai(): void
    {
        $user = User::factory()->create();
        $this->createTransactions($user, 4, '2026-09-10');

        CategoryAdvisor::fake();

        $saved = app(CategorySuggestionService::class)->generateMonthlySuggestions($user, '2026-09');

        $this->assertSame(0, $saved);
        CategoryAdvisor::assertNeverPrompted();
    }

    public function test_the_month_is_read_correctly_on_days_it_does_not_have(): void
    {
        $this->travelTo('2026-10-31 09:00');

        $user = User::factory()->create();
        $this->createTransactions($user, 5, '2026-09-10');

        CategoryAdvisor::fake([['suggestions' => []]]);

        app(CategorySuggestionService::class)->generateMonthlySuggestions($user, '2026-09');

        CategoryAdvisor::assertPrompted(fn ($prompt): bool => str_contains($prompt->prompt, 'Month: September 2026'));
    }

    public function test_monthly_review_saves_only_new_valid_suggestions(): void
    {
        $user = User::factory()->create();
        $transport = Category::factory()->for($user)->expense()->create(['name' => 'Transport']);
        $misc = Category::factory()->for($user)->expense()->create(['name' => 'Misc']);
        $othersCategory = Category::factory()->expense()->create(['name' => 'Another Users Private Category']);
        $this->createTransactions($user, 6, '2026-09-15', $transport, 'Shell petrol Westlands');

        CategorySuggestion::factory()->for($user)->dismissed()->create(['action' => 'add', 'name' => 'Gym']);
        $stalePending = CategorySuggestion::factory()->for($user)->create(['name' => 'Old Idea', 'period' => '2026-08']);

        CategoryAdvisor::fake([[
            'suggestions' => [
                ['action' => 'add', 'category_id' => null, 'name' => 'fuel', 'type' => 'expense', 'icon' => 'Fuel', 'reason' => '6 petrol purchases were filed under Transport.'],
                ['action' => 'add', 'category_id' => null, 'name' => 'Transport', 'type' => 'expense', 'icon' => 'Bus', 'reason' => 'Already exists.'],
                ['action' => 'add', 'category_id' => null, 'name' => 'Gym', 'type' => 'expense', 'icon' => 'Dumbbell', 'reason' => 'Dismissed before.'],
                ['action' => 'rename', 'category_id' => $othersCategory->id, 'name' => 'Stolen', 'type' => 'expense', 'icon' => 'Tags', 'reason' => 'Not this user.'],
                ['action' => 'rename', 'category_id' => $misc->id, 'name' => 'Household Items', 'type' => 'income', 'icon' => 'NotARealIcon', 'reason' => 'Misc is mostly household goods.'],
                ['action' => 'add', 'category_id' => null, 'name' => 'Subscriptions', 'type' => 'expense', 'icon' => 'Repeat', 'reason' => 'Netflix and Spotify.'],
                ['action' => 'add', 'category_id' => null, 'name' => 'Pets', 'type' => 'expense', 'icon' => 'PawPrint', 'reason' => 'Over the limit of three.'],
            ],
        ]]);

        $saved = app(CategorySuggestionService::class)->generateMonthlySuggestions($user, '2026-09');

        $this->assertSame(3, $saved);
        $this->assertModelMissing($stalePending);

        $pending = CategorySuggestion::query()->where('user_id', $user->id)->where('status', 'pending')->orderBy('created_at')->get();

        $this->assertSame(['Fuel', 'Household Items', 'Subscriptions'], $pending->pluck('name')->all());
        $this->assertSame($misc->id, $pending[1]->category_id);
        $this->assertSame('expense', $pending[1]->type, 'A rename keeps the existing category type.');
        $this->assertSame('Tags', $pending[1]->icon, 'Unknown icons fall back to a safe default.');
        $this->assertSame('2026-09', $pending[0]->period);

        Notification::assertSentTo($user, CategorySuggestionsReady::class, fn (CategorySuggestionsReady $notification): bool => $notification->count === 3);

        CategoryAdvisor::assertPrompted(fn (AgentPrompt $prompt): bool => str_contains($prompt->prompt, 'September 2026')
            && str_contains($prompt->prompt, '"name":"Transport"')
            && str_contains($prompt->prompt, 'Shell petrol Westlands')
            && ! str_contains($prompt->prompt, $othersCategory->name));
    }

    public function test_no_notification_is_sent_when_there_is_nothing_to_suggest(): void
    {
        $user = User::factory()->create();
        $this->createTransactions($user, 5, '2026-09-01');

        CategoryAdvisor::fake([['suggestions' => []]]);

        app(CategorySuggestionService::class)->generateMonthlySuggestions($user, '2026-09');

        Notification::assertNothingSent();
    }

    public function test_accepting_an_add_suggestion_creates_the_category(): void
    {
        $user = User::factory()->create();
        Category::factory()->for($user)->create(['position' => 1]);
        $suggestion = CategorySuggestion::factory()->for($user)->create(['name' => 'Fuel', 'icon' => 'Fuel', 'color' => '#0f766e']);

        $this->actingAs($user)->postJson(route('api.category-suggestions.accept', $suggestion))
            ->assertOk()
            ->assertJsonPath('message', 'Added Fuel.');

        $this->assertDatabaseHas('categories', ['user_id' => $user->id, 'name' => 'Fuel', 'icon' => 'Fuel', 'type' => 'expense', 'position' => 2]);
        $this->assertSame(CategorySuggestion::STATUS_ACCEPTED, $suggestion->fresh()->status);
    }

    public function test_accepting_a_rename_suggestion_renames_the_category(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->create(['name' => 'Misc']);
        $suggestion = CategorySuggestion::factory()->for($user)->rename()->create(['category_id' => $category->id, 'name' => 'Household Items']);

        $this->actingAs($user)->postJson(route('api.category-suggestions.accept', $suggestion))
            ->assertOk()
            ->assertJsonPath('message', 'Category renamed to Household Items.');

        $this->assertSame('Household Items', $category->fresh()->name);
    }

    public function test_a_suggestion_cannot_be_accepted_twice_or_clash_with_an_existing_name(): void
    {
        $user = User::factory()->create();
        $suggestion = CategorySuggestion::factory()->for($user)->create(['name' => 'Fuel']);

        $this->actingAs($user)->postJson(route('api.category-suggestions.accept', $suggestion))->assertOk();
        $this->actingAs($user)->postJson(route('api.category-suggestions.accept', $suggestion))->assertUnprocessable();

        $clashing = CategorySuggestion::factory()->for($user)->create(['name' => 'fuel']);

        $this->actingAs($user)->postJson(route('api.category-suggestions.accept', $clashing))
            ->assertUnprocessable()
            ->assertJsonPath('errors.suggestion.0', 'You already have a category called fuel.');

        $this->assertSame(1, Category::query()->where('user_id', $user->id)->count());
    }

    public function test_dismissed_suggestions_are_not_suggested_again(): void
    {
        $user = User::factory()->create();
        $suggestion = CategorySuggestion::factory()->for($user)->create(['name' => 'Fuel']);

        $this->actingAs($user)->postJson(route('api.category-suggestions.dismiss', $suggestion))->assertOk();

        $this->assertSame(CategorySuggestion::STATUS_DISMISSED, $suggestion->fresh()->status);

        $this->createTransactions($user, 5, '2026-09-05');
        CategoryAdvisor::fake([[
            'suggestions' => [['action' => 'add', 'category_id' => null, 'name' => 'Fuel', 'type' => 'expense', 'icon' => 'Fuel', 'reason' => 'Again.']],
        ]]);

        $this->assertSame(0, app(CategorySuggestionService::class)->generateMonthlySuggestions($user, '2026-09'));
    }

    public function test_users_cannot_act_on_another_users_suggestion(): void
    {
        $suggestion = CategorySuggestion::factory()->create();
        $intruder = User::factory()->create();

        $this->actingAs($intruder)->postJson(route('api.category-suggestions.accept', $suggestion))->assertForbidden();
        $this->actingAs($intruder)->postJson(route('api.category-suggestions.dismiss', $suggestion))->assertForbidden();

        $this->assertTrue($suggestion->fresh()->isPending());
    }

    public function test_the_monthly_command_queues_a_review_for_active_users_only(): void
    {
        Queue::fake();

        $active = User::factory()->create();
        $quiet = User::factory()->create();
        $lastMonthOnly = User::factory()->create();

        $this->createTransactions($active, 5, '2026-09-20');
        $this->createTransactions($quiet, 2, '2026-09-20');
        $this->createTransactions($lastMonthOnly, 8, '2026-08-20');

        $this->artisan('categories:suggest', ['--month' => '2026-09'])
            ->expectsOutputToContain('Queued category reviews for 1 active users (2026-09).')
            ->assertSuccessful();

        Queue::assertPushed(GenerateCategorySuggestions::class, 1);
        Queue::assertPushed(GenerateCategorySuggestions::class, fn (GenerateCategorySuggestions $job): bool => $job->user->is($active)
            && $job->period === '2026-09'
            && $job->uniqueId() === "{$active->id}:2026-09");
    }

    public function test_the_command_reviews_last_month_by_default(): void
    {
        Queue::fake();
        $this->travelTo('2026-11-01 07:00:00');

        $user = User::factory()->create();
        $this->createTransactions($user, 5, '2026-10-31');

        $this->artisan('categories:suggest')->assertSuccessful();

        Queue::assertPushed(GenerateCategorySuggestions::class, fn (GenerateCategorySuggestions $job): bool => $job->period === '2026-10');
    }

    public function test_the_review_is_scheduled_monthly(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->first(fn ($event): bool => str_contains((string) $event->command, 'categories:suggest'));

        $this->assertNotNull($event, 'categories:suggest is not scheduled.');
        $this->assertSame('0 7 1 * *', $event->expression);
    }

    private function createTransactions(User $user, int $count, string $date, ?Category $category = null, ?string $notes = null): void
    {
        $category ??= Category::factory()->for($user)->expense()->create();

        Transaction::factory()->count($count)->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'transaction_date' => $date,
            'notes' => $notes,
        ]);
    }
}
