<?php

namespace App\Jobs;

use App\Http\Services\CategorySuggestionService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateCategorySuggestions implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 90;

    /**
     * @param  string  $period  The month to review, as YYYY-MM.
     */
    public function __construct(public User $user, public string $period) {}

    /**
     * Seconds to wait before retrying (e.g. after a provider rate limit).
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [30, 300];
    }

    /**
     * One review per user per month, even if the command runs twice.
     */
    public function uniqueId(): string
    {
        return "{$this->user->id}:{$this->period}";
    }

    public function handle(CategorySuggestionService $service): void
    {
        $service->generateMonthlySuggestions($this->user, $this->period);
    }
}
