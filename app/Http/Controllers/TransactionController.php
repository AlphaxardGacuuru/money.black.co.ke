<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\TransactionResource;
use App\Http\Services\TransactionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function __construct(protected TransactionService $service) {}

    private function redirectTo(Request $request, string $fallback): string
    {
        $redirectTo = $request->string('redirect_to')->toString();

        return str_starts_with($redirectTo, '/') ? $redirectTo : $fallback;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        [$status, $message, $transactions, $accounts, $categories] = $this->service->index($request);

        if ($this->shouldReturnJson($request)) {
            return TransactionResource::collection($transactions)->additionally([
                'status' => $status,
                'message' => $message,
            ]);
        }

        return Inertia::render('transactions/index', [
            'transactions' => TransactionResource::collection($transactions),
            'accounts' => AccountResource::collection($accounts),
            'categories' => CategoryResource::collection($categories),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|string|exists:categories,id',
            'account_id' => 'required|string|exists:accounts,id',
            'amount' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
            'transaction_date' => 'required|date',
            'redirect_to' => 'nullable|string|max:255',
        ]);

        [$saved, $message, $transaction] = $this->service->store($request);

        if ($this->shouldReturnJson($request)) {
            return (new TransactionResource($transaction))->additional([
                'saved' => $saved,
                'message' => $message,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect($this->redirectTo($request, '/categories'));
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'category_id' => 'required|string|exists:categories,id',
            'account_id' => 'required|string|exists:accounts,id',
            'amount' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
            'transaction_date' => 'required|date',
            'redirect_to' => 'nullable|string|max:255',
        ]);

        [$saved, $message, $updatedTransaction] = $this->service->update($request, $id);
        $updatedTransaction->loadMissing([
            'account:id,name,currency,icon,color',
            'category:id,name,type,icon,color',
        ]);

        if ($this->shouldReturnJson($request)) {
            return (new TransactionResource($updatedTransaction))->additional([
                'saved' => $saved,
                'message' => $message,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect($this->redirectTo($request, '/transactions'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        [$deleted, $message, $transaction] = $this->service->destroy($id);

        if ($this->shouldReturnJson($request)) {
            return (new TransactionResource($transaction))->additional([
                'deleted' => $deleted,
                'message' => $message,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect($this->redirectTo($request, '/transactions'));
    }
}
