<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Http\Services\CategoryService;
use App\Http\Services\OverviewService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OverviewController extends Controller
{
    public function __construct(protected OverviewService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        [$status, $message, $categories] = (new CategoryService)->index($request);

        [
            $categories,
            $expenseTotal,
            $incomeTotal,
        ] = $this->service->index($categories);

        return CategoryResource::collection($categories->values())->additional([
            'totals' => [
                'expense' => $expenseTotal,
                'income' => $incomeTotal,
                'net' => $incomeTotal - $expenseTotal,
            ],
        ]);
    }
}
