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
            $categories = Category::query()
                ->where('user_id', $request->user()->id)
                ->select('id', 'name')
                ->orderBy('id', 'DESC')
                ->get();

            return [true, $categories->count() . ' Categories Retrieved Successfully', $categories];
        }

        $query = Category::query()->where('user_id', $request->user()->id);

        $query = $this->search($query, $request);

        $categories = $query
            ->orderBy('position', 'ASC')
            ->get();

        return [true, 'Categories Retrieved Successfully', $categories];
    }

    public function store(Request $request): array
    {
        $position = Category::query()
            ->where('user_id', auth('sanctum')->id())
            ->get()
            ->count() + 1;

        $category = new Category;
        $category->user_id = auth('sanctum')->id();
        $category->icon = $request->icon;
        $category->color = $request->color;
        $category->name = $request->name;
        $category->type = $request->type;
        $category->position = $position;
        $category->total = $request->input('total', 0);
        $saved = $category->save();

        return [$saved, 'Category Created Successfully', $category];
    }

    public function update(Request $request, Category $category): array
    {
        $category->icon = $request->input('icon', $category->icon);
        $category->color = $request->input('color', $category->color);
        $category->name = $request->input('name', $category->name);
        $category->type = $request->input('type', $category->type);
        $category->total = $request->input('total', $category->total);

        $message = 'Category Updated Successfully';

        if ($request->filled('position')) {
            [$position, $wasTaken] = $this->resolvePosition($request->integer('position'), $category);
            $category->position = $position;

            if ($wasTaken) {
                $message = "Position {$request->integer('position')} was already taken, moved to the last position instead";
            }
        }

        $saved = $category->save();

        return [$saved, $message, $category];
    }

    protected function resolvePosition(int $requestedPosition, Category $category): array
    {
        $positionTaken = Category::query()
            ->where('user_id', $category->user_id)
            ->where('id', '!=', $category->id)
            ->where('position', $requestedPosition)
            ->exists();

        if (! $positionTaken) {
            return [$requestedPosition, false];
        }

        $lastPosition = Category::query()
            ->where('user_id', $category->user_id)
            ->where('id', '!=', $category->id)
            ->max('position');

        return [(int) $lastPosition + 1, true];
    }

    public function destroy(Category $category): array
    {
        $deleted = $category->delete();

        return [$deleted, $category->name . ' Deleted Successfully', $category];
    }

    public function search(Builder $query, Request $request): Builder
    {
        $dateRange = $this->resolveDateRange($request);

        if ($dateRange !== null) {
            [$start, $end] = $dateRange;

            // Eager load transactions within the date range and calculate the total amount for each category
            $query
                ->withSum([
                    'transactions as computed_total' => function(Builder $query) use ($start, $end) {
                        $query->whereBetween('transaction_date', [$start, $end]);
                    },
                ], 'amount');
        }

        return $query;
    }
}
