<?php

namespace App\Console\Commands;

use App\Jobs\GenerateMonthlySummary;
use App\Models\User;
use App\Services\MonthlySummaryService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('overview:summarize {--month= : Month to summarise as YYYY-MM (defaults to last month)} {--user= : Only summarise this user ID}')]
#[Description('Queue an AI summary of each active user\'s spending for the month')]
class SummarizeMonth extends Command
{
    public function handle(): int
    {
        $month = $this->option('month')
            ? CarbonImmutable::createFromFormat('!Y-m', $this->option('month'))->startOfMonth()
            : CarbonImmutable::now()->subMonthNoOverflow()->startOfMonth();

        $period = $month->format('Y-m');

        $queued = 0;

        User::query()
            ->when($this->option('user'), fn ($query, $userId) => $query->whereKey($userId))
            ->whereHas(
                'transactions',
                fn ($query) => $query
                    ->whereBetween('transaction_date', [$month, $month->endOfMonth()]),
                '>=',
                MonthlySummaryService::MIN_TRANSACTIONS
            )
            ->lazy()
            ->each(function(User $user) use ($period, &$queued): void {
                GenerateMonthlySummary::dispatch($user, $period);
                $queued++;
            });

        $this->info("Queued monthly summaries for {$queued} active users ({$period}).");

        return self::SUCCESS;
    }
}
