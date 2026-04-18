<?php

namespace App\Http\Services;

use App\Models\Account;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class AccountService extends Service
{
    /*
     * Get All Accounts
     */
    public function index(Request $request): array
    {
        if ($request->filled('idAndName')) {
            $accountQuery = Account::where('user_id', auth()->id())->select('id', 'name');

            $accounts = $accountQuery
                ->orderBy('id', 'DESC')
                ->get();

            return [true, $accounts->count() . ' Accounts Retrieved Successfully', $accounts];
        }

        $query = Account::where('user_id', auth()->id());

        $query = $this->search($query, $request);

        $accounts = $query
            ->orderby('id', 'ASC')
            ->get();

        return [true, $accounts->count() . ' Accounts Retrieved Successfully', $accounts];
    }

    /*
    * Store Account
    */
    public function store(Request $request): array
    {
        if ($request->input('isDefault')) {
            // If the account is being set as default, unset the current default account for the user
            Account::where('user_id', auth()->id())
                ->where('is_default', true)
                ->update(['is_default' => false]);
        } else {
            $defaultDoesntExist = Account::where('user_id', auth()->id())
                ->where('is_default', true)
                ->doesntExist();

            // If no default account exists, set this account as default
            if ($defaultDoesntExist) {
                $request->merge(['isDefault' => true]);
            }
        }

        $account = new Account;
        $account->user_id = auth()->id();
        $account->icon = $request->icon;
        $account->color = $request->color;
        $account->name = $request->name;
        $account->currency = $request->currency;
        $account->type = $request->type;
        $account->description = $request->description;
        $account->is_default = $request->isDefault;
        $saved = $account->save();

        return [$saved, 'Account Created Successfully', $account];
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): array
    {
        $account = Account::find($id);

        if (! $account) {
            return [false, 'Account Not Found', null];
        }

        return [true, 'Account Retrieved Successfully', $account];
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): array
    {
        $account = Account::findOrFail($id);
        $account->icon = $request->input('icon', $account->icon);
        $account->color = $request->input('color', $account->color);
        $account->name = $request->input('name', $account->name);
        $account->currency = $request->input('currency', $account->currency);
        $account->type = $request->input('type', $account->type);
        $account->description = $request->input('description', $account->description);

        if ($request->has('isDefault')) {
            // If the account is being set as default, unset the current default account for the user
            if ($request->input('isDefault')) {
                Account::where('user_id', $account->user_id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }
        }

        $account->is_default = $request->input('isDefault', $account->is_default);
        $saved = $account->save();

        return [$saved, 'Account Updated Successfully', $account];
    }

    /*
     * Soft Delete Service
     */
    public function destroy(string $id): array
    {
        $account = Account::findOrFail($id);

        $deleted = $account->delete();

        return [$deleted, $account->name . ' Deleted Successfully', $account];
    }

    /*
     * Search
     */
    public function search(Builder $query, Request $request): Builder
    {
        $userId = $request->input('userId');

        if ($request->filled('userId')) {
            $query->where('user_id', $userId);
        }

        $name = $request->input('name');

        if ($request->filled('name')) {
            $query->where('name', 'LIKE', '%' . $name . '%');
        }

        $type = $request->input('type');

        if ($request->filled('type')) {
            $query->where('type', $type);
        }

        return $query;
    }
}
