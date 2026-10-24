<?php

namespace Tests\Feature;

use App\Ai\Agents\ReceiptScanner;
use App\Http\Services\ReceiptService;
use App\Jobs\ProcessReceipt;
use App\Models\Account;
use App\Models\Category;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Prompts\AgentPrompt;
use RuntimeException;
use Tests\TestCase;

class ReceiptControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake(Receipt::DISK);

        $this->withHeaders(['X-Requested-With' => 'XMLHttpRequest']);
    }

    public function test_guests_cannot_access_receipts(): void
    {
        $this->getJson(route('api.receipts.index'))->assertUnauthorized();
        $this->postJson(route('api.receipts.store'))->assertUnauthorized();
    }

    public function test_uploading_a_receipt_scans_it_and_saves_the_items_for_review(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['is_default' => true]);
        $groceries = Category::factory()->for($user)->expense()->create(['name' => 'Groceries']);
        $household = Category::factory()->for($user)->expense()->create(['name' => 'Household']);
        $otherUsersCategory = Category::factory()->expense()->create();

        ReceiptScanner::fake([[
            'is_receipt' => true,
            'merchant' => 'Naivas Westlands',
            'date' => '2026-10-20',
            'currency' => 'kes',
            'total' => 1160,
            'tax' => 160,
            'discount' => null,
            'items' => [
                ['description' => 'Bread', 'quantity' => 2, 'amount' => 129.6, 'category_id' => $groceries->id],
                ['description' => 'Omo 1kg', 'quantity' => 1, 'amount' => 450, 'category_id' => $household->id],
                ['description' => 'Milk', 'quantity' => 1, 'amount' => 420, 'category_id' => $otherUsersCategory->id],
                ['description' => 'Bag', 'quantity' => 1, 'amount' => 0, 'category_id' => null],
            ],
        ]]);

        $response = $this->actingAs($user)->postJson(route('api.receipts.store'), [
            'file' => UploadedFile::fake()->image('receipt.jpg'),
        ]);

        $response->assertCreated()->assertJsonPath('data.status', Receipt::STATUS_PROCESSING);

        $receipt = Receipt::query()->sole();

        Storage::disk(Receipt::DISK)->assertExists($receipt->path);

        $this->assertSame(Receipt::STATUS_REVIEW, $receipt->status);
        $this->assertSame('Naivas Westlands', $receipt->merchant);
        $this->assertSame('2026-10-20', $receipt->receipt_date->toDateString());
        $this->assertSame('KES', $receipt->currency);
        $this->assertSame(1160, $receipt->total);
        $this->assertSame($account->id, $receipt->account_id);

        $items = $receipt->items;

        $this->assertCount(3, $items, 'Zero-amount lines are dropped.');
        $this->assertSame(130, $items[0]->amount, 'Amounts are rounded to whole shillings.');
        $this->assertSame($groceries->id, $items[0]->category_id);
        $this->assertSame($household->id, $items[1]->category_id);
        $this->assertNull($items[2]->category_id, "Another user's category is never assigned.");

        ReceiptScanner::assertPrompted(function(AgentPrompt $prompt) use ($groceries): bool {
            return count($prompt->attachments) === 1
                && in_array(['id' => $groceries->id, 'name' => 'Groceries'], $prompt->agent->categories, true);
        });
    }

    public function test_only_expense_categories_are_offered_to_the_scanner(): void
    {
        $user = User::factory()->create();
        Category::factory()->for($user)->expense()->create(['name' => 'Food']);
        Category::factory()->for($user)->income()->create(['name' => 'Salary']);

        ReceiptScanner::fake();

        $this->actingAs($user)->postJson(route('api.receipts.store'), [
            'file' => UploadedFile::fake()->image('receipt.png'),
        ])->assertCreated();

        ReceiptScanner::assertPrompted(fn (AgentPrompt $prompt): bool => array_column($prompt->agent->categories, 'name') === ['Food']);
    }

    public function test_pdf_receipts_can_be_uploaded(): void
    {
        $user = User::factory()->create();

        Queue::fake();

        $this->actingAs($user)->postJson(route('api.receipts.store'), [
            'file' => UploadedFile::fake()->create('invoice.pdf', 200, 'application/pdf'),
        ])->assertCreated()->assertJsonPath('data.isPdf', true);

        Queue::assertPushed(ProcessReceipt::class);
    }

    public function test_uploads_must_be_an_image_or_pdf(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson(route('api.receipts.store'), [
            'file' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
        ])->assertUnprocessable()->assertJsonValidationErrors('file');

        $this->assertDatabaseCount('receipts', 0);
    }

    public function test_uploads_must_be_10mb_or_smaller(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson(route('api.receipts.store'), [
            'file' => UploadedFile::fake()->image('huge.jpg')->size(10241),
        ])->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    public function test_the_same_receipt_cannot_be_uploaded_twice(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('receipt.jpg');

        Queue::fake();

        $this->actingAs($user)->postJson(route('api.receipts.store'), ['file' => $file])->assertCreated();

        $this->actingAs($user)->postJson(route('api.receipts.store'), ['file' => $file])
            ->assertUnprocessable()
            ->assertJsonPath('errors.file.0', 'You have already uploaded this receipt.');

        $this->assertDatabaseCount('receipts', 1);
    }

    public function test_a_receipt_that_failed_can_be_uploaded_again(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('receipt.jpg');

        Receipt::factory()->for($user)->failed()->create(['file_hash' => hash_file('sha256', $file->getRealPath())]);

        Queue::fake();

        $this->actingAs($user)->postJson(route('api.receipts.store'), ['file' => $file])->assertCreated();
    }

    public function test_images_that_are_not_receipts_are_marked_as_failed(): void
    {
        $user = User::factory()->create();

        ReceiptScanner::fake([[
            'is_receipt' => false,
            'merchant' => null,
            'date' => null,
            'currency' => null,
            'total' => null,
            'tax' => null,
            'discount' => null,
            'items' => [],
        ]]);

        $this->actingAs($user)->postJson(route('api.receipts.store'), [
            'file' => UploadedFile::fake()->image('cat.jpg'),
        ])->assertCreated();

        $receipt = Receipt::query()->sole();

        $this->assertSame(Receipt::STATUS_FAILED, $receipt->status);
        $this->assertNotNull($receipt->failure_reason);
        $this->assertCount(0, $receipt->items);
    }

    public function test_dates_in_the_future_or_unreadable_are_left_blank(): void
    {
        $user = User::factory()->create();

        ReceiptScanner::fake([[
            'is_receipt' => true,
            'merchant' => 'Shop',
            'date' => now()->addMonth()->toDateString(),
            'currency' => null,
            'total' => 100,
            'tax' => null,
            'discount' => null,
            'items' => [['description' => 'Item', 'quantity' => 1, 'amount' => 100, 'category_id' => null]],
        ]]);

        $this->actingAs($user)->postJson(route('api.receipts.store'), [
            'file' => UploadedFile::fake()->image('receipt.jpg'),
        ])->assertCreated();

        $receipt = Receipt::query()->sole();

        $this->assertNull($receipt->receipt_date);
        $this->assertSame('KES', $receipt->currency);
    }

    public function test_a_job_that_gives_up_marks_the_receipt_as_failed(): void
    {
        $receipt = Receipt::factory()->create();

        (new ProcessReceipt($receipt))->failed(new RuntimeException('Gemini is down'));

        $this->assertSame(Receipt::STATUS_FAILED, $receipt->fresh()->status);
        $this->assertNotNull($receipt->fresh()->failure_reason);
    }

    public function test_the_job_skips_receipts_that_are_no_longer_processing(): void
    {
        $receipt = Receipt::factory()->confirmed()->create();

        ReceiptScanner::fake();

        (new ProcessReceipt($receipt))->handle(app(ReceiptService::class));

        ReceiptScanner::assertNeverPrompted();
    }

    public function test_users_only_see_their_own_receipts(): void
    {
        $user = User::factory()->create();
        Receipt::factory()->for($user)->review()->create();
        Receipt::factory()->review()->create();

        $this->actingAs($user)->getJson(route('api.receipts.index'))
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_users_cannot_view_or_download_another_users_receipt(): void
    {
        $receipt = Receipt::factory()->review()->create();
        $intruder = User::factory()->create();

        $this->actingAs($intruder)->getJson(route('api.receipts.show', $receipt))->assertForbidden();
        $this->actingAs($intruder)->get(route('api.receipts.file', $receipt))->assertForbidden();
        $this->actingAs($intruder)->deleteJson(route('api.receipts.destroy', $receipt))->assertForbidden();
        $this->actingAs($intruder)->postJson(route('api.receipts.retry', $receipt))->assertForbidden();
    }

    public function test_owners_can_download_their_receipt_file(): void
    {
        $user = User::factory()->create();
        Storage::disk(Receipt::DISK)->put('receipts/test.jpg', 'image-bytes');
        $receipt = Receipt::factory()->for($user)->review()->create(['path' => 'receipts/test.jpg']);

        $response = $this->actingAs($user)->get(route('api.receipts.file', $receipt));

        $response->assertOk();
        $this->assertSame('image-bytes', $response->streamedContent());
    }

    public function test_confirming_creates_one_transaction_per_category_and_shares_out_the_tax(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['balance' => 10000]);
        $groceries = Category::factory()->for($user)->expense()->create(['total' => 0]);
        $household = Category::factory()->for($user)->expense()->create(['total' => 0]);
        $receipt = Receipt::factory()->for($user)->review()->create();

        $response = $this->actingAs($user)->postJson(route('api.receipts.confirm', $receipt), [
            'account_id' => $account->id,
            'merchant' => 'Naivas',
            'receipt_date' => '2026-10-20',
            'total' => 1160,
            'items' => [
                ['description' => 'Bread', 'quantity' => 2, 'amount' => 300, 'category_id' => $groceries->id],
                ['description' => 'Milk', 'quantity' => 1, 'amount' => 300, 'category_id' => $groceries->id],
                ['description' => 'Omo', 'quantity' => 1, 'amount' => 400, 'category_id' => $household->id],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', Receipt::STATUS_CONFIRMED)
            ->assertJsonPath('message', 'Added 2 transactions.');

        $transactions = Transaction::query()->where('receipt_id', $receipt->id)->get()->keyBy('category_id');

        $this->assertCount(2, $transactions);
        $this->assertSame(696, $transactions[$groceries->id]->amount, '600 of 1000 items + 60% of the 160 tax');
        $this->assertSame(464, $transactions[$household->id]->amount, '400 of 1000 items + 40% of the 160 tax');
        $this->assertSame('Naivas: Bread, Milk', $transactions[$groceries->id]->notes);
        $this->assertSame('2026-10-20', $transactions[$groceries->id]->transaction_date->toDateString());

        $this->assertSame(10000 - 1160, $account->fresh()->balance);
        $this->assertSame(696, $groceries->fresh()->total);
        $this->assertSame(464, $household->fresh()->total);

        $this->assertSame(Receipt::STATUS_CONFIRMED, $receipt->fresh()->status);
        $this->assertCount(3, $receipt->fresh()->items);
    }

    public function test_a_failed_receipt_can_be_entered_manually_and_confirmed(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create();
        $receipt = Receipt::factory()->for($user)->failed()->create();

        $this->actingAs($user)->postJson(route('api.receipts.confirm', $receipt), [
            'account_id' => $account->id,
            'receipt_date' => now()->toDateString(),
            'total' => 250,
            'items' => [['description' => 'Lunch', 'amount' => 250, 'category_id' => $category->id]],
        ])->assertOk();

        $this->assertDatabaseHas('transactions', ['receipt_id' => $receipt->id, 'amount' => 250]);
    }

    public function test_a_receipt_cannot_be_confirmed_twice(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create();
        $receipt = Receipt::factory()->for($user)->review()->create();

        $payload = [
            'account_id' => $account->id,
            'receipt_date' => now()->toDateString(),
            'total' => 100,
            'items' => [['description' => 'Item', 'amount' => 100, 'category_id' => $category->id]],
        ];

        $this->actingAs($user)->postJson(route('api.receipts.confirm', $receipt), $payload)->assertOk();
        $this->actingAs($user)->postJson(route('api.receipts.confirm', $receipt), $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('receipt');

        $this->assertSame(1, Transaction::query()->where('receipt_id', $receipt->id)->count());
    }

    public function test_confirming_rejects_categories_and_accounts_the_user_does_not_own(): void
    {
        $user = User::factory()->create();
        $receipt = Receipt::factory()->for($user)->review()->create();
        $othersAccount = Account::factory()->create();
        $othersCategory = Category::factory()->expense()->create();
        $incomeCategory = Category::factory()->for($user)->income()->create();

        $this->actingAs($user)->postJson(route('api.receipts.confirm', $receipt), [
            'account_id' => $othersAccount->id,
            'receipt_date' => now()->toDateString(),
            'total' => 200,
            'items' => [
                ['description' => 'A', 'amount' => 100, 'category_id' => $othersCategory->id],
                ['description' => 'B', 'amount' => 100, 'category_id' => $incomeCategory->id],
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors(['account_id', 'items.0.category_id', 'items.1.category_id']);

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_confirming_requires_a_category_on_every_item(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();
        $receipt = Receipt::factory()->for($user)->review()->create();

        $this->actingAs($user)->postJson(route('api.receipts.confirm', $receipt), [
            'account_id' => $account->id,
            'receipt_date' => now()->toDateString(),
            'total' => 100,
            'items' => [['description' => 'Item', 'amount' => 100, 'category_id' => null]],
        ])->assertUnprocessable()->assertJsonPath('errors', ['items.0.category_id' => ['Choose a category for every item.']]);
    }

    public function test_users_cannot_confirm_another_users_receipt(): void
    {
        $receipt = Receipt::factory()->review()->create();
        $intruder = User::factory()->create();

        $this->actingAs($intruder)->postJson(route('api.receipts.confirm', $receipt), [])->assertForbidden();
    }

    public function test_failed_receipts_can_be_retried(): void
    {
        $user = User::factory()->create();
        $receipt = Receipt::factory()->for($user)->failed()->create();

        Queue::fake();

        $this->actingAs($user)->postJson(route('api.receipts.retry', $receipt))
            ->assertOk()
            ->assertJsonPath('data.status', Receipt::STATUS_PROCESSING);

        Queue::assertPushed(ProcessReceipt::class, fn (ProcessReceipt $job): bool => $job->receipt->is($receipt));
    }

    public function test_only_failed_receipts_can_be_retried(): void
    {
        $user = User::factory()->create();
        $receipt = Receipt::factory()->for($user)->review()->create();

        $this->actingAs($user)->postJson(route('api.receipts.retry', $receipt))->assertUnprocessable();
    }

    public function test_deleting_a_receipt_removes_the_file_but_keeps_its_transactions(): void
    {
        $user = User::factory()->create();
        Storage::disk(Receipt::DISK)->put('receipts/old.jpg', 'bytes');
        $receipt = Receipt::factory()->for($user)->confirmed()->create(['path' => 'receipts/old.jpg']);
        ReceiptItem::factory()->for($receipt)->create();
        $transaction = Transaction::factory()->for($user)->create(['user_id' => $user->id, 'receipt_id' => $receipt->id]);

        $this->actingAs($user)->deleteJson(route('api.receipts.destroy', $receipt))->assertOk();

        Storage::disk(Receipt::DISK)->assertMissing('receipts/old.jpg');
        $this->assertModelMissing($receipt);
        $this->assertDatabaseCount('receipt_items', 0);
        $this->assertNull($transaction->fresh()->receipt_id);
    }

    public function test_allocation_always_adds_up_to_the_receipt_total(): void
    {
        $service = app(ReceiptService::class);

        $this->assertSame(['a' => 100, 'b' => 200], $service->allocateTotal(['a' => 100, 'b' => 200], 300));
        $this->assertSame(['a' => 34, 'b' => 33, 'c' => 33], $service->allocateTotal(['a' => 1, 'b' => 1, 'c' => 1], 100));
        $this->assertSame(['a' => 90, 'b' => 180], $service->allocateTotal(['a' => 100, 'b' => 200], 270), 'Discounts are shared out too.');
        $this->assertSame(1001, array_sum($service->allocateTotal(['a' => 333, 'b' => 333, 'c' => 334], 1001)));
    }
}
