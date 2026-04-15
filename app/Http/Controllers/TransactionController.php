<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\TransactionResource;
use App\Http\Services\TransactionService;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function __construct(protected TransactionService $service) {}

    private function shouldReturnJson(Request $request): bool
    {
        return $request->expectsJson() && ! $request->header('X-Inertia');
    }

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
        $transactions = Transaction::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'account:id,name,currency,icon,color',
                'category:id,name,type,icon,color',
            ])
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->get();

        if ($this->shouldReturnJson($request)) {
            return TransactionResource::collection($transactions);
        }

        $accounts = Account::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();
        $categories = Category::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

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
        $transaction->loadMissing([
            'account:id,name,currency,icon,color',
            'category:id,name,type,icon,color',
        ]);

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
    public function show(string $transaction)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $transaction)
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
    public function destroy(string $transaction)
    {
        //
    }
}
