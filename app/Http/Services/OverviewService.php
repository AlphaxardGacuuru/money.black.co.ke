<?php

namespace App\Http\Services;

class OverviewService extends Service
{
	public function index($categories): array
	{
		$categories = $categories
			->sortByDesc(fn($category) => $category->computed_total ?? $category->total);

		$expenseTotal = (int) $categories
			->where('type', 'expense')
			->sum(fn($category) => $category->computed_total ?? $category->total);

		$incomeTotal = (int) $categories
			->where('type', 'income')
			->sum(fn($category) => $category->computed_total ?? $category->total);

		return [
			$categories,
			$expenseTotal,
			$incomeTotal,
		];
	}
}
