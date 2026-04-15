<?php

namespace App\Http\Services;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class TransactionService extends Service
{
	public function store($request)
	{
		return DB::transaction(function () use ($request) {
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

	public function update($request, string $id)
	{
		return DB::transaction(function () use ($request, $id) {
			$transaction = Transaction::where('user_id', auth()->id())
				->findOrFail($id);

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

			$transaction->category_id = $nextCategory->id;
			$transaction->account_id = $nextAccount->id;
			$transaction->amount = (int) $request->amount;
			$transaction->currency = $nextAccount->currency ?? 'KES';
			$transaction->notes = $request->input('notes');
			$transaction->transaction_date = $request->transaction_date;
			$saved = $transaction->save();

			$this->applyTransactionImpact($nextCategory, $nextAccount, (int) $transaction->amount);
			$this->persistAdjustedModels($currentCategory, $nextCategory, $currentAccount, $nextAccount);

			return [$saved, 'Transaction Updated Successfully', $transaction];
		});
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

	private function persistAdjustedModels(
		Category $currentCategory,
		Category $nextCategory,
		Account $currentAccount,
		Account $nextAccount,
	): void {
		foreach ([$currentCategory->id => $currentCategory, $nextCategory->id => $nextCategory] as $category) {
			$category->save();
		}

		foreach ([$currentAccount->id => $currentAccount, $nextAccount->id => $nextAccount] as $account) {
			$account->save();
		}
	}
}
