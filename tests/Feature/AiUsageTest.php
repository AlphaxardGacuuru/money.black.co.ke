<?php

namespace Tests\Feature;

use App\Ai\Agents\CategoryAdvisor;
use App\Ai\Agents\ReceiptScanner;
use App\Http\Services\AiUsageService;
use App\Http\Services\CategorySuggestionService;
use App\Http\Services\ReceiptService;
use App\Models\Account;
use App\Models\AiUsage;
use App\Models\Category;
use App\Models\Receipt;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\Data\Usage;
use Laravel\Ai\Responses\StructuredTextResponse;
use RuntimeException;
use Tests\TestCase;

class AiUsageTest extends TestCase
{
    use RefreshDatabase;

    private const ADMIN_EMAIL = 'alphaxardgacuuru47@gmail.com';

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake(Receipt::DISK);

        config()->set('ai.pricing.gemini-3.1-flash-lite', ['input' => 0.25, 'cached_input' => 0.025, 'output' => 1.50]);
    }

    public function test_scanning_a_receipt_records_its_tokens_and_cost(): void
    {
        $user = User::factory()->create();
        Account::factory()->for($user)->create(['is_default' => true]);

        ReceiptScanner::fake([$this->scannerResponse(new Usage(promptTokens: 2000, completionTokens: 300, cacheReadInputTokens: 400, reasoningTokens: 100))]);

        $this->actingAs($user)->postJson(route('api.receipts.store'), [
            'file' => UploadedFile::fake()->image('receipt.jpg'),
        ])->assertCreated();

        $receipt = Receipt::query()->sole();
        $usage = AiUsage::query()->sole();

        $this->assertSame($user->id, $usage->user_id);
        $this->assertTrue($usage->subject->is($receipt));
        $this->assertSame(AiUsage::FEATURE_RECEIPT_SCAN, $usage->feature);
        $this->assertSame('gemini-3.1-flash-lite', $usage->model);
        $this->assertSame(1, $usage->attempt);
        $this->assertSame(2000, $usage->input_tokens);
        $this->assertSame(400, $usage->cached_input_tokens);
        $this->assertSame(300, $usage->output_tokens);
        $this->assertSame(100, $usage->reasoning_tokens);
        // 2000 x 0.25 + 400 x 0.025 + (300 + 100) x 1.50 = 500 + 10 + 600 micro-dollars.
        $this->assertSame(1110, $usage->cost_micros);
    }

    public function test_every_scan_attempt_is_recorded_with_its_attempt_number(): void
    {
        $user = User::factory()->create();
        $receipt = Receipt::factory()->for($user)->create(['status' => Receipt::STATUS_PROCESSING]);
        Storage::disk(Receipt::DISK)->put($receipt->path, 'image-bytes');

        ReceiptScanner::fake([
            $this->scannerResponse(new Usage(1000, 100)),
            $this->scannerResponse(new Usage(1000, 100)),
        ]);

        app(ReceiptService::class)->process($receipt, 1);
        app(ReceiptService::class)->process($receipt->fresh(), 2);

        $this->assertSame([1, 2], AiUsage::query()->orderBy('attempt')->pluck('attempt')->all());
    }

    public function test_a_failed_ai_request_records_no_usage(): void
    {
        $user = User::factory()->create();
        $receipt = Receipt::factory()->for($user)->create(['status' => Receipt::STATUS_PROCESSING]);
        Storage::disk(Receipt::DISK)->put($receipt->path, 'image-bytes');

        ReceiptScanner::fake(fn () => throw new RuntimeException('Provider unavailable'));

        try {
            app(ReceiptService::class)->process($receipt);
        } catch (RuntimeException) {
        }

        $this->assertSame(0, AiUsage::query()->count());
    }

    public function test_usage_is_kept_when_the_receipt_is_deleted(): void
    {
        $user = User::factory()->create();
        $receipt = Receipt::factory()->for($user)->review()->create();
        AiUsage::factory()->for($user)->create(['subject_type' => $receipt->getMorphClass(), 'subject_id' => $receipt->id]);

        $this->actingAs($user)->deleteJson(route('api.receipts.destroy', $receipt))->assertSuccessful();

        $this->assertSame(1, AiUsage::query()->count(), 'Deleting a receipt must not erase what it cost.');
    }

    public function test_the_monthly_category_review_records_its_usage(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->expense()->create();
        Transaction::factory()->count(5)->create(['user_id' => $user->id, 'category_id' => $category->id, 'transaction_date' => '2026-09-10']);

        CategoryAdvisor::fake([new StructuredTextResponse(['suggestions' => []], '{"suggestions":[]}', new Usage(3000, 200), new Meta('gemini', 'gemini-3.1-flash-lite'))]);

        app(CategorySuggestionService::class)->generateMonthlySuggestions($user, '2026-09');

        $usage = AiUsage::query()->sole();

        $this->assertSame(AiUsage::FEATURE_CATEGORY_REVIEW, $usage->feature);
        $this->assertNull($usage->subject_id);
        $this->assertSame(3000 * 0.25 + 200 * 1.50, (float) $usage->cost_micros);
    }

    public function test_models_without_a_price_are_recorded_at_zero_cost(): void
    {
        $this->assertSame(0, app(AiUsageService::class)->costInMicros('some-unknown-model', 1000, 0, 1000));
        $this->assertSame(0, app(AiUsageService::class)->costInMicros(null, 1000, 0, 1000));
    }

    public function test_admins_see_this_months_usage_totalled_per_user(): void
    {
        $admin = User::factory()->create(['email' => self::ADMIN_EMAIL]);
        $heavy = User::factory()->create(['name' => 'Heavy User']);
        $light = User::factory()->create(['name' => 'Light User']);

        $this->travelTo('2026-10-15 12:00');

        AiUsage::factory()->for($heavy)->count(2)->create(['input_tokens' => 1000, 'cached_input_tokens' => 0, 'output_tokens' => 100, 'reasoning_tokens' => 0, 'cost_micros' => 400]);
        AiUsage::factory()->for($heavy)->categoryReview()->create(['input_tokens' => 2000, 'cached_input_tokens' => 0, 'output_tokens' => 50, 'reasoning_tokens' => 0, 'cost_micros' => 600]);
        AiUsage::factory()->for($light)->create(['input_tokens' => 500, 'cached_input_tokens' => 0, 'output_tokens' => 10, 'reasoning_tokens' => 0, 'cost_micros' => 100]);
        AiUsage::factory()->for($light)->create(['cost_micros' => 9999, 'created_at' => '2026-09-30 23:00']);

        $response = $this->actingAs($admin)->getJson(route('api.admin.ai-usage.index'));

        $response->assertOk()
            ->assertJsonPath('month', '2026-10')
            ->assertJsonPath('totals.costMicros', 1500)
            ->assertJsonPath('totals.requests', 4)
            ->assertJsonPath('totals.receiptScans', 3)
            ->assertJsonPath('users.0.name', 'Heavy User')
            ->assertJsonPath('users.0.requests', 3)
            ->assertJsonPath('users.0.receiptScans', 2)
            ->assertJsonPath('users.0.inputTokens', 4000)
            ->assertJsonPath('users.0.outputTokens', 250)
            ->assertJsonPath('users.0.costMicros', 1400)
            ->assertJsonPath('users.1.name', 'Light User')
            ->assertJsonPath('users.1.costMicros', 100);

        $this->actingAs($admin)->getJson(route('api.admin.ai-usage.index', ['month' => '2026-09']))
            ->assertOk()
            ->assertJsonPath('totals.costMicros', 9999);
    }

    public function test_the_month_must_be_valid(): void
    {
        $admin = User::factory()->create(['email' => self::ADMIN_EMAIL]);

        $this->actingAs($admin)->getJson(route('api.admin.ai-usage.index', ['month' => 'October']))
            ->assertJsonValidationErrors('month');
    }

    public function test_only_admins_can_see_ai_usage(): void
    {
        $user = User::factory()->create();

        $this->getJson(route('api.admin.ai-usage.index'))->assertUnauthorized();
        $this->actingAs($user)->getJson(route('api.admin.ai-usage.index'))->assertForbidden();

        $this->actingAs($user)->getJson(route('api.auth.show'))->assertJsonPath('data.can_view_ai_usage', false);
        $this->actingAs(User::factory()->create(['email' => self::ADMIN_EMAIL]))
            ->getJson(route('api.auth.show'))
            ->assertJsonPath('data.can_view_ai_usage', true);
    }

    private function scannerResponse(Usage $usage): StructuredTextResponse
    {
        $extraction = ['is_receipt' => true, 'merchant' => 'Naivas', 'date' => null, 'currency' => 'KES', 'total' => 100, 'tax' => null, 'discount' => null, 'items' => []];

        return new StructuredTextResponse($extraction, json_encode($extraction), $usage, new Meta('gemini', 'gemini-3.1-flash-lite'));
    }
}
