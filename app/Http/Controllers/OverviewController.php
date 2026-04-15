<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OverviewController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = Category::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('total')
            ->orderBy('name')
            ->get();

        $expenseTotal = (int) $categories
            ->where('type', 'expense')
            ->sum('total');
        $incomeTotal = (int) $categories
            ->where('type', 'income')
            ->sum('total');

        return Inertia::render('overview/index', [
            'categories' => CategoryResource::collection($categories),
            'totals' => [
                'expense' => $expenseTotal,
                'income' => $incomeTotal,
                'net' => $incomeTotal - $expenseTotal,
            ],
        ]);
    }
}
