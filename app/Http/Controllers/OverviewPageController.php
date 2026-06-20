<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Http\Services\CategoryService;
use App\Http\Services\OverviewService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OverviewPageController extends Controller
{
    public function __construct(
        protected CategoryService $categoryService,
        protected OverviewService $overviewService,
    ) {}

    public function index(Request $request): Response
    {
        [$status, $message, $categories] = $this->categoryService->index($request);

        [$categories, $expenseTotal, $incomeTotal] = $this->overviewService->index($categories);

        return Inertia::render('overview/index', [
            'categories' => CategoryResource::collection($categories->values()),
            'totals' => [
                'expense' => $expenseTotal,
                'income' => $incomeTotal,
                'net' => $incomeTotal - $expenseTotal,
            ],
        ]);
    }
}
