<?php

namespace App\Http\Services;

use App\Http\Resources\AccountResource;
use App\Models\CardTransaction;
use App\Models\MPESATransaction;
use App\Models\Account;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AccountService extends Service
{
	/*
     * Get All Accounts
     */
	public function index($request)
	{
		if ($request->filled("idAndName")) {
			$accountQuery = Account::select("id", "name");

			$accounts = $accountQuery
				->orderBy("id", "DESC")
				->get();

			return $accounts;
		}

		$query = new Account;

		$query = $this->search($query, $request);

		$accounts = $query
			->orderby("id", "ASC")
			->paginate();

		return $accounts;
	}

	/*
	* Store Account
	*/
	public function store($request)
	{
		$account = new Account;
		$account->user_id = auth("sanctum")->id();
		$account->icon = $request->icon;
		$account->color = $request->color;
		$account->name = $request->name;
		$account->currency = $request->currency;
		$account->type = $request->type;
		$account->description = $request->description;
		$account->is_default = $request->is_default;
		$saved = $account->save();

		return [$saved, "Account Created Successfully", $account];
	}

	/**
	 * Display the specified resource.
	 *
	 */
	public function show($id)
	{
		return Account::findOrFail($id);
	}

	/**
	 * Update the specified resource in storage.
	 *
	 */
	public function update($request, $id)
	{
		$account = Account::findOrFail($id);
		$account->icon = $request->input('icon', $account->icon);
		$account->color = $request->input('color', $account->color);
		$account->name = $request->input('name', $account->name);
		$account->currency = $request->input('currency', $account->currency);
		$account->type = $request->input('type', $account->type);
		$account->description = $request->input('description', $account->description);

		if ($request->has('is_default')) {
			// If the account is being set as default, unset the current default account for the user
			if ($request->input('is_default')) {
				Account::where('user_id', $account->user_id)
					->where('is_default', true)
					->update(['is_default' => false]);
			}
		}

		$account->is_default = $request->input('is_default', $account->is_default);
		$saved = $account->save();

		return [$saved, "Account Updated Successfully", $account];
	}

	/*
     * Soft Delete Service
     */
	public function destory($id)
	{
		$account = Account::findOrFail($id);

		$deleted = $account->delete();

		return [$deleted, $account->name . " Deleted Successfully", $account];
	}

	/*
     * Search
     */
	public function search($query, $request)
	{
		$userId = $request->input("userId");

		if ($request->filled("userId")) {
			$query = $query->where("user_id", $userId);
		}

		$name = $request->input("name");

		if ($request->filled("name")) {
			$query = $query->where("name", "LIKE", "%" . $name . "%");
		}

		$type = $request->input("type");

		if ($request->filled("type")) {
			$query = $query->where("type", $type);
		}

		return $query;
	}
}