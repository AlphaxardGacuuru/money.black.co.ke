<?php

namespace App\Console\Commands;

use App\Http\Services\CategorySuggestionService;
use App\Jobs\GenerateCategorySuggestions;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('categories:suggest {--month= : Month to review as YYYY-MM (defaults to last month)} {--user= : Only review this user ID}')]
#[Description('Queue an AI review of each active user\'s categories for the month')]
class SuggestCategories extends Command
{
    public function handle(): int
    {
        $month = $this->option('month')
            ? CarbonImmutable::createFromFormat('!Y-m', $this->option('month'))->startOfMonth()
            : CarbonImmutable::now()->subMonthNoOverflow()->startOfMonth();

        $period = $month->format('Y-m');

        $users = User::query()
            ->when($this->option('user'), fn ($query, $userId) => $query->whereKey($userId))
            ->whereHas(
                'transactions',
                fn ($query) => $query->whereBetween('transaction_date', [$month, $month->endOfMonth()]),
                '>=',
                CategorySuggestionService::MIN_TRANSACTIONS
            )
            ->get();

        foreach ($users as $user) {
            GenerateCategorySuggestions::dispatch($user, $period);
        }

        $this->info("Queued category reviews for {$users->count()} active users ({$period}).");

        return self::SUCCESS;
    }
}
