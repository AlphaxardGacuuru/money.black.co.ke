<?php

namespace App\Http\Services;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionService extends Service
{
    public function index(Request $request): array
    {
        $query = Transaction::query()
            ->with(['account', 'category'])
            ->where('user_id', $request->user()->id);

        $query = $this->search($query, $request);

        $transactions = $query
            ->orderBy('transaction_date', 'ASC')
            ->orderBy('created_at', 'ASC')
            ->get();

        $summary = $this->buildPeriodSummary($request);

        $accounts = Account::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        $categories = Category::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return [
            true,
            $transactions->count() . ' Transactions Retrieved Successfully',
            $transactions,
            $summary,
        ];
    }

    private function buildPeriodSummary(Request $request): array
    {
        $accountsQuery = Account::query()->where('user_id', $request->user()->id);

        if ($request->filled('accountId')) {
            $accountsQuery->where('id', $request->input('accountId'));
        }

        $accounts = $accountsQuery->get(['id', 'balance', 'currency']);

        if ($accounts->isEmpty()) {
            return [
                'startingBalance' => 0,
                'endingBalance' => 0,
                'total' => 0,
                'currency' => 'KES',
            ];
        }

        $accountIds = $accounts->pluck('id');

        $movementQuery = Transaction::query()
            ->where('transactions.user_id', $request->user()->id)
            ->whereIn('transactions.account_id', $accountIds);

        $endingBalance = (int) $accounts->sum('balance');
        $periodNet = 0;
        $dateRange = $this->resolveDateRange($request);

        if ($dateRange !== null) {
            [$rangeStart, $rangeEnd] = $dateRange;

            $periodNet = $this->calculateNetMovement(
                (clone $movementQuery)->whereBetween('transaction_date', [$rangeStart, $rangeEnd])
            );

            $postPeriodNet = $this->calculateNetMovement(
                (clone $movementQuery)->where('transaction_date', '>', $rangeEnd)
            );

            $endingBalance -= $postPeriodNet;
        } else {
            $periodNet = $this->calculateNetMovement(clone $movementQuery);
        }

        $startingBalance = $endingBalance - $periodNet;

        return [
            'startingBalance' => $startingBalance,
            'endingBalance' => $endingBalance,
            'total' => $periodNet,
            'currency' => (string) ($accounts->first()->currency ?? 'KES'),
        ];
    }

    private function calculateNetMovement(Builder $query): int
    {
        $netMovement = (clone $query)
            ->join('categories', 'transactions.category_id', '=', 'categories.id')
            ->selectRaw("COALESCE(SUM(CASE WHEN categories.type = 'income' THEN transactions.amount ELSE -transactions.amount END), 0) as net_amount")
            ->value('net_amount');

        return (int) $netMovement;
    }

    public function store(Request $request): array
    {
        return DB::transaction(function() use ($request) {

            $category = Category::where('user_id', auth()->id())
                ->findOrFail($request->category_id);

            $account = Account::where('user_id', auth()->id())
                ->findOrFail($request->account_id);

            $transaction = new Transaction;
            $transaction->user_id = auth()->id();
            $transaction->category_id = $category->id;
            $transaction->account_id = $account->id;
            $transaction->amount = (int) $request->amount;
            $transaction->currency = $account->currency ?? 'KES';
            $transaction->notes = $request->input('notes');
            $transaction->transaction_date = $request->transaction_date;
            $saved = $transaction->save();

            $this->applyTransactionImpact($category, $account, $transaction->amount);

            $category->save();
            $account->save();

            return [$saved, 'Transaction Added Successfully', $transaction];
        });
    }

    public function update(Request $request, Transaction $transaction): array
    {
        return DB::transaction(function() use ($request, $transaction) {

            $currentCategory = Category::where('user_id', auth()->id())
                ->findOrFail($transaction->category_id);

            $currentAccount = Account::where('user_id', auth()->id())
                ->findOrFail($transaction->account_id);

            $nextCategory = (string) $currentCategory->id === (string) $request->category_id
                ? $currentCategory
                : Category::where('user_id', auth()->id())->findOrFail($request->category_id);

            $nextAccount = (string) $currentAccount->id === (string) $request->account_id
                ? $currentAccount
                : Account::where('user_id', auth()->id())->findOrFail($request->account_id);

            $this->reverseTransactionImpact($currentCategory, $currentAccount, (int) $transaction->amount);

            $currentCategory->save();
            $currentAccount->save();

            $transaction->category_id = $nextCategory->id;
            $transaction->account_id = $nextAccount->id;
            $transaction->amount = (int) $request->amount;
            $transaction->currency = $nextAccount->currency ?? 'KES';
            $transaction->notes = $request->input('notes');
            $transaction->transaction_date = $request->transaction_date;
            $saved = $transaction->save();

            $this->applyTransactionImpact($nextCategory, $nextAccount, (int) $transaction->amount);

            $nextCategory->save();
            $nextAccount->save();

            return [$saved, 'Transaction Updated Successfully', $transaction];
        });
    }

    public function destroy(Transaction $transaction): array
    {
        return DB::transaction(function() use ($transaction) {

            $category = Category::where('user_id', auth()->id())
                ->findOrFail($transaction->category_id);

            $account = Account::where('user_id', auth()->id())
                ->findOrFail($transaction->account_id);

            $this->reverseTransactionImpact($category, $account, (int) $transaction->amount);

            $deleted = $transaction->delete();
            $category->save();
            $account->save();

            return [$deleted, 'Transaction Deleted Successfully', $transaction];
        });
    }

    public function search(Builder $query, Request $request): Builder
    {
        if ($request->filled('categoryId')) {
            $query->where('category_id', $request->input('categoryId'));
        }

        if ($request->filled('accountId')) {
            $query->where('account_id', $request->input('accountId'));
        }

        if ($request->filled('notes')) {
            $query->where('notes', 'like', '%' . $request->input('notes') . '%');
        }

        if ($request->filled('amount')) {
            $query->where('amount', (int) $request->input('amount'));
        }

        $range = $this->resolveDateRange($request);

        if ($range) {
            $query->whereBetween('transaction_date', $range);
        }

        return $query;
    }

    private function applyTransactionImpact(Category $category, Account $account, int $amount): void
    {
        $category->total += $amount;

        if ($category->type === 'expense') {
            $account->balance -= $amount;

            return;
        }

        $account->balance += $amount;
    }

    private function reverseTransactionImpact(Category $category, Account $account, int $amount): void
    {
        $category->total -= $amount;

        if ($category->type === 'expense') {
            $account->balance += $amount;

            return;
        }

        $account->balance -= $amount;
    }
}
