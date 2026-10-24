<?php

namespace App\Jobs;

use App\Http\Services\ReceiptService;
use App\Models\Receipt;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ProcessReceipt implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 120;

    public function __construct(public Receipt $receipt) {}

    /**
     * Seconds to wait before retrying after a failure (e.g. a provider rate limit).
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60];
    }

    public function handle(ReceiptService $service): void
    {
        if ($this->receipt->status !== Receipt::STATUS_PROCESSING) {
            return;
        }

        $service->process($this->receipt);
    }

    public function failed(?Throwable $exception): void
    {
        app(ReceiptService::class)->markFailed($this->receipt, $exception);
    }
}
