<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Http\Services\CategoryService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OverviewController extends Controller
{
    public function __construct(protected CategoryService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        [$status, $message, $categories] = $this->service->index($request);

        $categories = $categories->sortByDesc(fn($cat) => $cat->computed_total ?? $cat->total);

        $expenseTotal = (int) $categories
            ->where('type', 'expense')
            ->sum(fn($cat) => $cat->computed_total ?? $cat->total);
        $incomeTotal = (int) $categories
            ->where('type', 'income')
            ->sum(fn($cat) => $cat->computed_total ?? $cat->total);

        return CategoryResource::collection($categories->values())->additional([
            'totals' => [
                'expense' => $expenseTotal,
                'income' => $incomeTotal,
                'net' => $incomeTotal - $expenseTotal,
            ],
        ]);
    }
}
