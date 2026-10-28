<?php

namespace Tests\Feature;

use App\Ai\Agents\ReceiptScanner;
use App\Http\Services\ReceiptService;
use App\Jobs\ProcessReceipt;
use App\Models\Receipt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class ReceiptProcessingStepsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake(Receipt::DISK);

        $this->withHeaders(['X-Requested-With' => 'XMLHttpRequest']);
    }

    public function test_a_new_upload_waits_in_the_queue_step(): void
    {
        $user = User::factory()->create();

        Queue::fake();

        $this->actingAs($user)->postJson(route('api.receipts.store'), [
            'file' => UploadedFile::fake()->image('receipt.jpg'),
        ])
            ->assertCreated()
            ->assertJsonPath('data.processingStep', Receipt::STEP_QUEUED)
            ->assertJsonPath('data.processingAttempt', null);

        $this->assertNotNull(Receipt::query()->sole()->processing_step_at);
    }

    public function test_the_receipt_is_in_the_reading_step_while_the_ai_reads_it(): void
    {
        $receipt = $this->storedReceipt();
        $stepDuringPrompt = null;
        $attemptDuringPrompt = null;

        ReceiptScanner::fake([function() use ($receipt, &$stepDuringPrompt, &$attemptDuringPrompt): array {
            $stepDuringPrompt = $receipt->fresh()->processing_step;
            $attemptDuringPrompt = $receipt->fresh()->processing_attempt;

            return $this->readableExtraction();
        }]);

        app(ReceiptService::class)->process($receipt, 2);

        $this->assertSame(Receipt::STEP_READING, $stepDuringPrompt);
        $this->assertSame(2, $attemptDuringPrompt);
        $this->assertSame(Receipt::STATUS_REVIEW, $receipt->fresh()->status);
        $this->assertNull($receipt->fresh()->processing_step, 'The step is cleared once reading is done.');
    }

    public function test_an_ai_failure_is_logged_and_rethrown_so_the_job_retries(): void
    {
        $receipt = $this->storedReceipt();

        ReceiptScanner::fake([fn () => throw new RuntimeException('Gemini returned 503')]);

        Log::shouldReceive('error')
            ->once()
            ->withArgs(fn (string $message, array $context): bool => $message === 'Receipt scan: the AI request failed.'
                && $context['receipt_id'] === $receipt->id
                && $context['user_id'] === $receipt->user_id
                && $context['step'] === Receipt::STEP_READING
                && $context['attempt'] === 1
                && $context['exception'] instanceof RuntimeException);

        $job = (new ProcessReceipt($receipt))->withFakeQueueInteractions();

        try {
            $job->handle(app(ReceiptService::class));
            $this->fail('The exception should reach the queue so the job is retried.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Gemini returned 503', $exception->getMessage());
        }

        $receipt->refresh();

        $this->assertSame(Receipt::STATUS_PROCESSING, $receipt->status);
        $this->assertSame(Receipt::STEP_RETRYING, $receipt->processing_step);
    }

    public function test_the_last_attempt_is_not_marked_as_retrying(): void
    {
        $receipt = $this->storedReceipt();

        ReceiptScanner::fake([fn () => throw new RuntimeException('Gemini returned 503')]);
        Log::shouldReceive('error')->once();

        $job = (new ProcessReceipt($receipt))->withFakeQueueInteractions();
        $job->job->attempts = $job->tries;

        try {
            $job->handle(app(ReceiptService::class));
        } catch (RuntimeException) {
            //
        }

        $this->assertSame(Receipt::STEP_READING, $receipt->fresh()->processing_step);
        $this->assertSame($job->tries, $receipt->fresh()->processing_attempt);
    }

    public function test_giving_up_is_logged_and_clears_the_step(): void
    {
        $receipt = Receipt::factory()->create(['processing_step' => Receipt::STEP_READING, 'processing_attempt' => 3]);
        $exception = new RuntimeException('Gemini is down');

        Log::shouldReceive('error')
            ->once()
            ->withArgs(fn (string $message, array $context): bool => $message === 'Receipt scan: gave up after the last attempt.'
                && $context['receipt_id'] === $receipt->id
                && $context['attempt'] === 3
                && $context['exception'] === $exception);

        (new ProcessReceipt($receipt))->failed($exception);

        $receipt->refresh();

        $this->assertSame(Receipt::STATUS_FAILED, $receipt->status);
        $this->assertNull($receipt->processing_step);
    }

    public function test_retrying_starts_again_from_the_queue_step(): void
    {
        $user = User::factory()->create();
        $receipt = Receipt::factory()->for($user)->failed()->create(['processing_attempt' => 3]);

        Queue::fake();

        $this->actingAs($user)->postJson(route('api.receipts.retry', $receipt))
            ->assertOk()
            ->assertJsonPath('data.processingStep', Receipt::STEP_QUEUED)
            ->assertJsonPath('data.processingAttempt', null);
    }

    public function test_step_details_are_hidden_once_the_receipt_is_no_longer_processing(): void
    {
        $user = User::factory()->create();
        $receipt = Receipt::factory()->for($user)->review()->create(['processing_step' => Receipt::STEP_SORTING]);

        $this->actingAs($user)->getJson(route('api.receipts.show', $receipt))
            ->assertOk()
            ->assertJsonPath('data.processingStep', null)
            ->assertJsonPath('data.processingStepAt', null);
    }

    public function test_jobs_are_tagged_with_the_receipt_and_user(): void
    {
        $receipt = Receipt::factory()->create();

        $this->assertSame(
            ['receipt:' . $receipt->id, 'user:' . $receipt->user_id],
            (new ProcessReceipt($receipt))->tags(),
        );
    }

    private function storedReceipt(): Receipt
    {
        $receipt = Receipt::factory()->create(['processing_step' => Receipt::STEP_QUEUED]);

        Storage::disk(Receipt::DISK)->put($receipt->path, UploadedFile::fake()->image('receipt.jpg')->getContent());

        return $receipt;
    }

    /**
     * @return array<string, mixed>
     */
    private function readableExtraction(): array
    {
        return [
            'is_receipt' => true,
            'merchant' => 'Naivas',
            'date' => null,
            'currency' => 'KES',
            'total' => 500,
            'tax' => null,
            'discount' => null,
            'items' => [['description' => 'Bread', 'quantity' => 1, 'amount' => 500, 'category_id' => null]],
        ];
    }
}
