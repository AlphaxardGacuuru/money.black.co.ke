<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReceiptShareTargetTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_manifest_declares_a_share_target_for_receipt_files(): void
    {
        $manifest = json_decode(file_get_contents(public_path('manifest.webmanifest')), true, flags: JSON_THROW_ON_ERROR);

        $shareTarget = $manifest['share_target'];

        $this->assertSame(route('receipts.share', absolute: false), $shareTarget['action']);
        $this->assertSame('POST', $shareTarget['method']);
        $this->assertSame('multipart/form-data', $shareTarget['enctype']);
        $this->assertSame('receipt', $shareTarget['params']['files'][0]['name']);
        $this->assertContains('application/pdf', $shareTarget['params']['files'][0]['accept']);
        $this->assertContains('image/jpeg', $shareTarget['params']['files'][0]['accept']);
    }

    public function test_the_service_worker_intercepts_the_share_target_and_keeps_shared_files_across_updates(): void
    {
        $serviceWorker = file_get_contents(public_path('sw.js'));

        $this->assertStringContainsString('const SHARE_TARGET_PATH = "/receipts/share"', $serviceWorker);
        $this->assertStringContainsString('.getAll("receipt")', $serviceWorker);
        $this->assertStringContainsString('key !== SHARED_RECEIPTS_CACHE', $serviceWorker);
    }

    public function test_the_receipts_page_reads_the_same_cache_the_service_worker_writes(): void
    {
        $cacheDeclaration = 'const SHARED_RECEIPTS_CACHE = "shared-receipts"';

        $this->assertStringContainsString($cacheDeclaration, file_get_contents(public_path('sw.js')));
        $this->assertStringContainsString($cacheDeclaration, file_get_contents(resource_path('js/hooks/use-shared-receipt-import.ts')));
    }

    public function test_a_share_that_reaches_the_server_redirects_to_receipts_without_a_csrf_error(): void
    {
        Storage::fake('local');

        $response = $this->post(route('receipts.share'), [
            'receipt' => UploadedFile::fake()->image('receipt.jpg'),
        ]);

        $response->assertStatus(303)->assertRedirect('/receipts?share=unavailable');

        $this->assertDatabaseCount('receipts', 0);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_the_fallback_does_not_need_an_authenticated_user(): void
    {
        $this->post(route('receipts.share'))->assertRedirect('/receipts?share=unavailable');

        $this->actingAs(User::factory()->create())
            ->post(route('receipts.share'))
            ->assertRedirect('/receipts?share=unavailable');
    }
}
