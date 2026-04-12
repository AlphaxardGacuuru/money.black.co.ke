<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountResource;
use App\Http\Services\AccountService;
use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(protected AccountService $service) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $accounts = $this->service->index($request);

        return AccountResource::collection($accounts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'icon' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'currency' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:regular',
            'description' => 'nullable|string|max:255',
            'is_default' => 'nullable|boolean',
        ]);

        [$saved, $message, $account] = $this->service->store($request);

        return (new AccountResource($account))->additional([
            'saved' => $saved,
            'message' => $message,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $account = Account::findOrFail($id);

        return new AccountResource($account);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'icon' => 'sometimes|string|max:255',
            'color' => 'sometimes|string|max:255',
            'name' => 'sometimes|string|max:255',
            'currency' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:regular',
            'description' => 'nullable|string|max:255',
            'is_default' => 'nullable|boolean',
        ]);

        [$saved, $message, $account] = $this->service->update($request, $id);

        return (new AccountResource($account))->additional([
            'saved' => $saved,
            'message' => $message,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        [$deleted, $message, $account] = $this->service->destory($id);

        return (new AccountResource($account))->additional([
            'deleted' => $deleted,
            'message' => $message,
        ]);
    }
}