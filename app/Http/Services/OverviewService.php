<?php

namespace App\Http\Services;

use Illuminate\Support\Collection;

class OverviewService extends Service
{
	public function index(Collection $categories): array
	{
		$categories = $categories
			->sortByDesc(fn($category) => $this->resolveCategoryTotal($category));

		$expenseTotal = (int) $categories
			->where('type', 'expense')
			->sum(fn($category) => $this->resolveCategoryTotal($category));

		$incomeTotal = (int) $categories
			->where('type', 'income')
			->sum(fn($category) => $this->resolveCategoryTotal($category));

		return [
			$categories,
			$expenseTotal,
			$incomeTotal,
		];
	}

	public function resolveCategoryTotal($category): int
	{
		$attributes = $category->getAttributes();

		if (array_key_exists('computed_total', $attributes)) {
			return (int) ($category->computed_total ?? 0);
		}

		return (int) ($category->total ?? 0);
	}
}
