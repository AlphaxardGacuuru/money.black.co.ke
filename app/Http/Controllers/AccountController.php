<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountResource;
use App\Http\Services\AccountService;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function __construct(protected AccountService $service) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->expectsJson()) {
            $accounts = $this->service->index($request);

            return AccountResource::collection($accounts);
        }

        $accounts = Account::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return Inertia::render('accounts/index', [
            'accounts' => AccountResource::collection($accounts),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('accounts/create');
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
            'type' => 'nullable|string|in:regular,savings,mobile',
            'description' => 'nullable|string|max:255',
            'is_default' => 'nullable|boolean',
        ]);

        [$saved, $message, $account] = $this->service->store($request);

        if ($request->expectsJson()) {
            return (new AccountResource($account))->additional([
                'saved' => $saved,
                'message' => $message,
            ]);
        }

        return to_route('accounts.index');
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
     * Show the form for editing the specified resource.
     */
    public function edit($id): Response
    {
        $account = Account::findOrFail($id);

        return Inertia::render('accounts/[id]/edit', [
            'account' => new AccountResource($account),
        ]);
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
            'type' => 'nullable|string|in:regular,savings,mobile',
            'description' => 'nullable|string|max:255',
            'is_default' => 'nullable|boolean',
        ]);

        [$saved, $message, $account] = $this->service->update($request, $id);

        if ($request->expectsJson()) {
            return (new AccountResource($account))->additional([
                'saved' => $saved,
                'message' => $message,
            ]);
        }

        return to_route('accounts.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        [$deleted, $message, $account] = $this->service->destory($id);

        if ($request->expectsJson()) {
            return (new AccountResource($account))->additional([
                'deleted' => $deleted,
                'message' => $message,
            ]);
        }

        return to_route('accounts.index');
    }
}
