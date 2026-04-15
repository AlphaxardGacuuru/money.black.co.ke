<?php

namespace App\Http\Services;

use App\Models\Category;

class CategoryService extends Service
{
    public function index($request)
    {
        if ($request->filled('idAndName')) {
            return Category::where('user_id', $request->user()->id)
                ->select('id', 'name')
                ->orderBy('id', 'DESC')
                ->get();
        }

        $query = Category::where('user_id', $request->user()->id);

        $query = $this->search($query, $request);

        return $query
            ->orderby('id', 'ASC')
            ->paginate();
    }

    public function show($id)
    {
        $category = Category::find($id);

        if (! $category) {
            return [false, 'Category Not Found', null];
        }

        return [true, 'Category Retrieved Successfully', $category];
    }

    public function store($request)
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

    public function update($request, string $id)
    {
        $category = Category::where('user_id', auth()->id())->findOrFail($id);

        $category->icon = $request->input('icon', $category->icon);
        $category->color = $request->input('color', $category->color);
        $category->name = $request->input('name', $category->name);
        $category->type = $request->input('type', $category->type);
        $category->currency = $request->input('currency', $category->currency ?? 'KES');
        $category->total = $request->input('total', $category->total);
        $saved = $category->save();

        return [$saved, 'Category Updated Successfully', $category];
    }

    public function destroy(string $id)
    {
        $category = Category::where('user_id', auth()->id())->findOrFail($id);
        $name = $category->name;

        $deleted = $category->delete();

        return [$deleted, $name.' Deleted Successfully', $category];
    }

    public function search($query, $request)
    {
        $name = $request->input('name');

        if ($request->filled('name')) {
            $query = $query->where('name', 'LIKE', '%'.$name.'%');
        }

        return $query;
    }
}
