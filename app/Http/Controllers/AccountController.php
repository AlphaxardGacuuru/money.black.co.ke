<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountResource;
use App\Http\Services\AccountService;
use App\Models\Account;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AccountController extends Controller
{
    public function __construct(protected AccountService $service) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        [$status, $message, $accounts] = $this->service->index($request);

        return AccountResource::collection($accounts)->additional([
            'status' => $status,
            'message' => $message,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): AccountResource
    {
        $request->validate([
            'icon' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'currency' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:regular,savings,mobile',
            'description' => 'nullable|string|max:255',
            'isDefault' => 'nullable|boolean',
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
    public function show(Account $account): AccountResource
    {
        return (new AccountResource($account))->additional([
            'status' => true,
            'message' => 'Account Retrieved Successfully',
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): AccountResource|RedirectResponse
    {
        $request->validate([
            'icon' => 'sometimes|string|max:255',
            'color' => 'sometimes|string|max:255',
            'name' => 'sometimes|string|max:255',
            'currency' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:regular,savings,mobile',
            'description' => 'nullable|string|max:255',
            'isDefault' => 'nullable|boolean',
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
    public function destroy(Request $request, string $id): AccountResource|RedirectResponse
    {
        [$deleted, $message, $account] = $this->service->destroy($id);

        return (new AccountResource($account))->additional([
            'deleted' => $deleted,
            'message' => $message,
        ]);
    }
}
