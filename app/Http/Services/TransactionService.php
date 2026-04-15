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

			$category->total += $transaction->amount;
			$category->save();

			if ($category->type === 'expense') {
				$account->balance -= $transaction->amount;
			} else {
				$account->balance += $transaction->amount;
			}

			$account->save();

			return [$saved, 'Transaction Added Successfully', $transaction];
		});
	}
}
