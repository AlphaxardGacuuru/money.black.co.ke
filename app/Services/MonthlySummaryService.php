<?php

namespace App\Services;

use App\Ai\Agents\SpendingSummarizer;
use App\Models\AiUsage;
use App\Models\MonthlySummary;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\MonthlySummaryReady;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class MonthlySummaryService
{
    /**
     * Months with fewer transactions aren't summarised: there's too little to say.
     */
    public const MIN_TRANSACTIONS = 5;

    /**
     * How many categories and large expenses are described to the AI.
     */
    public const TOP_CATEGORIES = 6;

    public const LARGEST_EXPENSES = 5;

    public function __construct(protected AiUsageService $aiUsageService) {}

    /**
     * Calculate the month's figures, have the AI describe them, save the summary and notify the user.
     * Running it again for the same month replaces the earlier summary.
     *
     * @param  string  $period  The month to summarise, as YYYY-MM.
     */
    public function generate(User $user, string $period): ?MonthlySummary
    {
        $month = CarbonImmutable::createFromFormat('!Y-m', $period);
        $transactions = $this->transactionsFor($user, $month);

        if ($transactions->count() < self::MIN_TRANSACTIONS) {
            return null;
        }

        $stats = $this->stats($transactions, $this->transactionsFor($user, $month->subMonthNoOverflow()));

        $response = (new SpendingSummarizer)->prompt($this->buildPrompt($month, $stats));

        $this->aiUsageService->record($user->id, AiUsage::FEATURE_MONTHLY_SUMMARY, $response);

        $summary = MonthlySummary::updateOrCreate(
            ['user_id' => $user->id, 'period' => $period],
            [
                'headline' => Str::limit(trim((string) ($response['headline'] ?? '')), 120, ''),
                'summary' => Str::limit(trim((string) ($response['summary'] ?? '')), 1000, ''),
                'stats' => $stats,
            ],
        );

        $user->notify(new MonthlySummaryReady($summary));

        return $summary;
    }

    /**
     * The month's totals, per-category spending and largest expenses, compared with the previous month.
     *
     * @param  Collection<int, Transaction>  $transactions
     * @param  Collection<int, Transaction>  $previousTransactions
     * @return array{transactions: int, expense: int, income: int, previousExpense: int|null, previousIncome: int|null, categories: array<int, array{name: string, total: int, previousTotal: int, share: int}>, largestExpenses: array<int, array{note: string, category: string, amount: int, date: string}>}
     */
    public function stats(Collection $transactions, Collection $previousTransactions): array
    {
        $expenses = $transactions->filter(fn (Transaction $transaction): bool => $transaction->category?->type === 'expense');
        $previousExpenses = $previousTransactions->filter(fn (Transaction $transaction): bool => $transaction->category?->type === 'expense');
        $expenseTotal = (int) $expenses->sum('amount');
        $hasPreviousMonth = $previousTransactions->isNotEmpty();
        $previousByCategory = $previousExpenses->groupBy('category_id')->map(fn (Collection $items): int => (int) $items->sum('amount'));

        return [
            'transactions' => $transactions->count(),
            'expense' => $expenseTotal,
            'income' => (int) $transactions->filter(fn (Transaction $transaction): bool => $transaction->category?->type === 'income')->sum('amount'),
            'previousExpense' => $hasPreviousMonth ? (int) $previousExpenses->sum('amount') : null,
            'previousIncome' => $hasPreviousMonth
                ? (int) $previousTransactions->filter(fn (Transaction $transaction): bool => $transaction->category?->type === 'income')->sum('amount')
                : null,
            'categories' => $expenses->groupBy('category_id')
                ->map(fn (Collection $items, string $categoryId): array => [
                    'name' => (string) $items->first()->category->name,
                    'total' => (int) $items->sum('amount'),
                    'previousTotal' => $previousByCategory->get($categoryId, 0),
                    'share' => $expenseTotal > 0 ? (int) round($items->sum('amount') / $expenseTotal * 100) : 0,
                ])
                ->sortByDesc('total')
                ->take(self::TOP_CATEGORIES)
                ->values()
                ->all(),
            'largestExpenses' => $expenses->sortByDesc('amount')
                ->take(self::LARGEST_EXPENSES)
                ->map(fn (Transaction $transaction): array => [
                    'note' => Str::limit(trim((string) $transaction->notes), 80) ?: (string) $transaction->category->name,
                    'category' => (string) $transaction->category->name,
                    'amount' => (int) $transaction->amount,
                    'date' => $transaction->transaction_date->toDateString(),
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * Describe the figures with amounts and changes already written out, so the AI never does arithmetic.
     *
     * @param  array<string, mixed>  $stats
     */
    private function buildPrompt(CarbonImmutable $month, array $stats): string
    {
        $hasPreviousMonth = $stats['previousExpense'] !== null;

        $payload = [
            'month' => $month->format('F Y'),
            'previousMonth' => $hasPreviousMonth ? $month->subMonthNoOverflow()->format('F Y') : null,
            'transactions' => $stats['transactions'],
            'spent' => $this->money($stats['expense']),
            'income' => $this->money($stats['income']),
            'spentLastMonth' => $hasPreviousMonth ? $this->money($stats['previousExpense']) : null,
            'spendingChange' => $hasPreviousMonth ? $this->change($stats['expense'], $stats['previousExpense']) : null,
            'incomeLastMonth' => $hasPreviousMonth ? $this->money($stats['previousIncome']) : null,
            'incomeChange' => $hasPreviousMonth ? $this->change($stats['income'], $stats['previousIncome']) : null,
            'categories' => array_map(fn (array $category): array => [
                'name' => $category['name'],
                'spent' => $this->money($category['total']),
                'shareOfSpending' => "{$category['share']}%",
                'changeFromLastMonth' => $hasPreviousMonth ? $this->change($category['total'], $category['previousTotal']) : null,
            ], $stats['categories']),
            'largestExpenses' => array_map(fn (array $expense): array => [
                ...$expense,
                'amount' => $this->money($expense['amount']),
            ], $stats['largestExpenses']),
        ];

        return json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    /**
     * @return Collection<int, Transaction>
     */
    private function transactionsFor(User $user, CarbonImmutable $month): Collection
    {
        return Transaction::query()
            ->where('user_id', $user->id)
            ->whereBetween('transaction_date', [$month->startOfMonth(), $month->endOfMonth()])
            ->with('category:id,name,type')
            ->get(['id', 'category_id', 'amount', 'notes', 'transaction_date']);
    }

    private function money(int $amount): string
    {
        return 'KES ' . number_format($amount);
    }

    /**
     * Describe a change in words, e.g. "12% more", "8% less", "new this month".
     */
    public function change(int $current, int $previous): string
    {
        if ($previous === 0) {
            return $current === 0 ? 'none either month' : 'new this month';
        }

        $percent = (int) round(($current - $previous) / $previous * 100);

        return match (true) {
            $percent === 0 => 'about the same',
            $percent > 0 => "{$percent}% more",
            default => abs($percent) . '% less',
        };
    }
}
