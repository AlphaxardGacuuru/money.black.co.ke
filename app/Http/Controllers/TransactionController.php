<?php

namespace App\Http\Controllers;

use App\Http\Resources\TransactionResource;
use App\Http\Services\TransactionService;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function __construct(protected TransactionService $service) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        [$status, $message, $transactions] = $this->service->index($request);

        return TransactionResource::collection($transactions)->additional([
            'status' => $status,
            'message' => $message,
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

        return (new TransactionResource($transaction))->additional([
            'saved' => $saved,
            'message' => $message,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Transaction $transaction)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transaction $transaction)
    {
        $request->validate([
            'category_id' => 'required|string|exists:categories,id',
            'account_id' => 'required|string|exists:accounts,id',
            'amount' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
            'transaction_date' => 'required|date',
            'redirect_to' => 'nullable|string|max:255',
        ]);

        [$saved, $message, $updatedTransaction] = $this->service->update($request, $transaction);

        return (new TransactionResource($updatedTransaction))->additional([
            'saved' => $saved,
            'message' => $message,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Transaction $transaction)
    {
        [$deleted, $message, $transaction] = $this->service->destroy($transaction);

        return (new TransactionResource($transaction))->additional([
            'deleted' => $deleted,
            'message' => $message,
        ]);
    }
}
