<?php

namespace App\Http\Services;

use App\Models\Category;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class CategoryService extends Service
{
    public function index(Request $request): array
    {
        if ($request->filled('idAndName')) {
            return Category::where('user_id', $request->user()->id)
                ->select('id', 'name')
                ->orderBy('id', 'DESC')
                ->get();
        }

        $query = Category::where('user_id', $request->user()->id);

        // $query = $this->search($query, $request);

        $categories = $query
            ->orderBy('created_at')
            ->get();

        return [true, 'Categories Retrieved Successfully', $categories];
    }

    public function show(string $id): array
    {
        $category = Category::find($id);

        if (! $category) {
            return [false, 'Category Not Found', null];
        }

        return [true, 'Category Retrieved Successfully', $category];
    }

    public function store(Request $request): array
    {
        $category = new Category;
        $category->user_id = auth()->id();
        $category->icon = $request->icon;
        $category->color = $request->color;
        $category->name = $request->name;
        $category->type = $request->type;
        $category->currency = $request->input('currency', 'KES');
        $category->total = $request->input('total', 0);
        $saved = $category->save();

        return [$saved, 'Category Created Successfully', $category];
    }

    public function update(Request $request, string $id): array
    {
        $category = Category::findOrFail($id);
        $category->icon = $request->input('icon', $category->icon);
        $category->color = $request->input('color', $category->color);
        $category->name = $request->input('name', $category->name);
        $category->type = $request->input('type', $category->type);
        $category->currency = $request->input('currency', $category->currency ?? 'KES');
        $category->total = $request->input('total', $category->total);
        $saved = $category->save();

        return [$saved, 'Category Updated Successfully', $category];
    }

    public function destroy(string $id): array
    {
        $category = Category::findOrFail($id);

        $deleted = $category->delete();

        return [$deleted, $category->name.' Deleted Successfully', $category];
    }

    public function search(Builder $query, Request $request): Builder
    {
        $dateRange = $this->resolveDateRange($request);

        if ($dateRange !== null) {
            [$start, $end] = $dateRange;

            $query->withSum([
                'transactions as computed_total' => function (Builder $q) use ($start, $end) {
                    $q->whereBetween('transaction_date', [$start, $end]);
                },
            ], 'amount');
        }

        return $query;
    }
}
