<?php

namespace Tests\Feature;

use App\Ai\Agents\SpendingSummarizer;
use App\Jobs\GenerateMonthlySummary;
use App\Models\AiUsage;
use App\Models\Category;
use App\Models\MonthlySummary;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\MonthlySummaryReady;
use App\Services\MonthlySummaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Laravel\Ai\Prompts\AgentPrompt;
use NotificationChannels\WebPush\WebPushChannel;
use Tests\TestCase;

class MonthlySummaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_it_summarises_the_month_from_figures_calculated_in_php(): void
    {
        $user = User::factory()->create();
        $groceries = Category::factory()->for($user)->expense()->create(['name' => 'Groceries']);
        $transport = Category::factory()->for($user)->expense()->create(['name' => 'Transport']);
        $salary = Category::factory()->for($user)->income()->create(['name' => 'Salary']);

        $this->transaction($user, $groceries, 1000, '2026-09-05');
        $this->transaction($user, $groceries, 2000, '2026-10-03', 'Naivas: Rice 2kg');
        $this->transaction($user, $groceries, 1000, '2026-10-10');
        $this->transaction($user, $transport, 500, '2026-10-12');
        $this->transaction($user, $transport, 500, '2026-10-20');
        $this->transaction($user, $salary, 90000, '2026-10-28');

        SpendingSummarizer::fake([['headline' => 'Groceries doubled', 'summary' => 'You spent KES 4,000 in October.']]);

        $summary = app(MonthlySummaryService::class)->generate($user, '2026-10');

        $this->assertSame('Groceries doubled', $summary->headline);
        $this->assertSame('You spent KES 4,000 in October.', $summary->summary);
        $this->assertSame(4000, $summary->stats['expense']);
        $this->assertSame(90000, $summary->stats['income']);
        $this->assertSame(1000, $summary->stats['previousExpense']);
        $this->assertSame(['name' => 'Groceries', 'total' => 3000, 'previousTotal' => 1000, 'share' => 75], $summary->stats['categories'][0]);
        $this->assertSame('Naivas: Rice 2kg', $summary->stats['largestExpenses'][0]['note']);
        $this->assertSame(AiUsage::FEATURE_MONTHLY_SUMMARY, AiUsage::query()->sole()->feature);
        Notification::assertSentTo($user, MonthlySummaryReady::class, fn (MonthlySummaryReady $notification): bool => $notification->summary->is($summary));

        SpendingSummarizer::assertPrompted(function(AgentPrompt $prompt): bool {
            $figures = json_decode($prompt->prompt, true);

            return $figures['month'] === 'October 2026'
                && $figures['spent'] === 'KES 4,000'
                && $figures['spendingChange'] === '300% more'
                && $figures['categories'][0]['changeFromLastMonth'] === '200% more'
                && $figures['categories'][1]['changeFromLastMonth'] === 'new this month';
        });
    }

    public function test_months_with_too_few_transactions_are_not_sent_to_the_ai(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->expense()->create();
        $this->transaction($user, $category, 100, '2026-10-05');

        SpendingSummarizer::fake();

        $this->assertNull(app(MonthlySummaryService::class)->generate($user, '2026-10'));
        SpendingSummarizer::assertNeverPrompted();
        Notification::assertNothingSent();
    }

    public function test_a_first_month_is_described_without_comparisons(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->expense()->create();

        foreach (range(1, 5) as $day) {
            $this->transaction($user, $category, 100, "2026-10-0{$day}");
        }

        SpendingSummarizer::fake([['headline' => 'First month', 'summary' => 'You spent KES 500.']]);

        $summary = app(MonthlySummaryService::class)->generate($user, '2026-10');

        $this->assertNull($summary->stats['previousExpense']);
        SpendingSummarizer::assertPrompted(fn (AgentPrompt $prompt): bool => json_decode($prompt->prompt, true)['spendingChange'] === null);
    }

    public function test_running_again_replaces_the_months_summary(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->expense()->create();

        foreach (range(1, 5) as $day) {
            $this->transaction($user, $category, 100, "2026-10-0{$day}");
        }

        SpendingSummarizer::fake([
            ['headline' => 'First', 'summary' => 'One.'],
            ['headline' => 'Second', 'summary' => 'Two.'],
        ]);

        app(MonthlySummaryService::class)->generate($user, '2026-10');
        app(MonthlySummaryService::class)->generate($user, '2026-10');

        $this->assertSame('Second', MonthlySummary::query()->sole()->headline);
    }

    public function test_the_summary_is_sent_by_push_email_and_in_app(): void
    {
        $user = User::factory()->create(['name' => 'Wanjiku']);
        $summary = MonthlySummary::factory()->for($user)->create([
            'period' => '2026-10',
            'headline' => 'Groceries doubled',
            'summary' => 'You spent KES 4,000 in October.',
        ]);
        $notification = new MonthlySummaryReady($summary);

        $this->assertSame([WebPushChannel::class, 'mail', 'database'], $notification->via($user));

        $mail = $notification->toMail($user);
        $this->assertSame('Your October 2026 money summary', $mail->subject);
        $this->assertContains('You spent KES 4,000 in October.', $mail->introLines);
        $this->assertSame(url('/overview?month=2026-10'), $mail->actionUrl);

        $this->assertSame(['url' => '/overview?month=2026-10', 'from' => config('app.name'), 'title' => 'Your October 2026 money summary', 'message' => 'Groceries doubled', 'period' => '2026-10'], $notification->toArray($user));
        $this->assertSame('Groceries doubled', $notification->toWebPush($user, $notification)->toArray()['body']);
    }

    public function test_changes_are_described_in_words(): void
    {
        $service = app(MonthlySummaryService::class);

        $this->assertSame('12% more', $service->change(1120, 1000));
        $this->assertSame('8% less', $service->change(920, 1000));
        $this->assertSame('about the same', $service->change(1001, 1000));
        $this->assertSame('new this month', $service->change(500, 0));
        $this->assertSame('none either month', $service->change(0, 0));
    }

    public function test_the_monthly_command_queues_last_month_for_active_users_only(): void
    {
        Queue::fake();
        $this->travelTo('2026-11-01 07:05');

        $active = User::factory()->create();
        $quiet = User::factory()->create();
        $activeCategory = Category::factory()->for($active)->expense()->create();
        $quietCategory = Category::factory()->for($quiet)->expense()->create();

        foreach (range(1, 5) as $day) {
            $this->transaction($active, $activeCategory, 100, "2026-10-0{$day}");
        }

        $this->transaction($quiet, $quietCategory, 100, '2026-10-01');

        $this->artisan('overview:summarize')
            ->expectsOutputToContain('Queued monthly summaries for 1 active users (2026-10).')
            ->assertSuccessful();

        Queue::assertPushed(GenerateMonthlySummary::class, 1);
        Queue::assertPushed(GenerateMonthlySummary::class, fn (GenerateMonthlySummary $job): bool => $job->user->is($active)
            && $job->uniqueId() === "{$active->id}:2026-10");
    }

    public function test_users_can_read_only_their_own_summary(): void
    {
        $user = User::factory()->create();
        MonthlySummary::factory()->for($user)->create(['period' => '2026-10', 'headline' => 'Mine']);
        MonthlySummary::factory()->create(['period' => '2026-09', 'headline' => 'Someone else']);

        $this->actingAs($user)->getJson(route('api.monthly-summaries.show', '2026-10'))
            ->assertOk()
            ->assertJsonPath('data.headline', 'Mine');

        $this->actingAs($user)->getJson(route('api.monthly-summaries.show', '2026-09'))
            ->assertOk()
            ->assertJsonPath('data', null);

        $this->actingAs($user)->getJson('/api/monthly-summaries/2026-13')->assertNotFound();
    }

    public function test_guests_cannot_read_summaries(): void
    {
        $this->getJson(route('api.monthly-summaries.show', '2026-10'))->assertUnauthorized();
    }

    private function transaction(User $user, Category $category, int $amount, string $date, ?string $notes = null): Transaction
    {
        return Transaction::factory()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'amount' => $amount,
            'transaction_date' => $date,
            'notes' => $notes,
        ]);
    }
}
