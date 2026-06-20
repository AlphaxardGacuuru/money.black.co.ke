<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountResource;
use App\Http\Resources\CategoryResource;
use App\Http\Services\TransactionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionPageController extends Controller
{
    public function __construct(protected TransactionService $service) {}

    public function index(Request $request): Response
    {
        [$status, $message, $transactions, $accounts, $categories] = $this->service->index($request);

        return Inertia::render('transactions/index', [
            'transactions' => [
                'data' => $transactions->map(fn ($t) => [
                    'id' => $t->id,
                    'notes' => $t->notes,
                    'amount' => [
                        'amount' => $t->amount,
                        'formatted' => number_format($t->amount, 2),
                    ],
                    'currency' => $t->currency,
                    'transactionDateHuman' => $t->transaction_date->format('d M Y'),
                    'transactionDateInput' => $t->transaction_date->toDateString(),
                    'account' => [
                        'id' => $t->account->id,
                        'name' => $t->account->name,
                        'icon' => $t->account->icon,
                        'color' => $t->account->color,
                        'currency' => $t->account->currency,
                        'balance' => [
                            'amount' => $t->account->balance,
                            'formatted' => number_format($t->account->balance, 2),
                        ],
                    ],
                    'category' => [
                        'id' => $t->category->id,
                        'name' => $t->category->name,
                        'type' => $t->category->type,
                        'icon' => $t->category->icon,
                        'color' => $t->category->color,
                    ],
                ]),
            ],
            'accounts' => AccountResource::collection($accounts),
            'categories' => CategoryResource::collection($categories),
        ]);
    }
}
