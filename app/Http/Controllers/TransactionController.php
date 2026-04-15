<?php

namespace App\Http\Controllers;

use App\Http\Resources\TransactionResource;
use App\Http\Services\TransactionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function __construct(protected TransactionService $service) {}

    private function shouldReturnJson(Request $request): bool
    {
        return $request->expectsJson() && ! $request->header('X-Inertia');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
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
        ]);

        [$saved, $message, $transaction] = $this->service->store($request);

        if ($this->shouldReturnJson($request)) {
            return (new TransactionResource($transaction))->additional([
                'saved' => $saved,
                'message' => $message,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect('/categories');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $transaction)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $transaction)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $transaction)
    {
        //
    }
}
