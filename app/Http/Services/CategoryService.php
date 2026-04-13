<?php

namespace App\Http\Services;

use App\Models\Category;

class CategoryService extends Service
{
    public function index($request)
    {
        $query = Category::query();

        $query = $this->search($query, $request);

        $categories = $query
            ->orderby('id', 'ASC')
            ->paginate();

        return [true, $categories->total().' Categories Retrieved Successfully', $categories];
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
        $category->user_id = auth('sanctum')->id();
        $category->icon = $request->icon;
        $category->color = $request->color;
        $category->name = $request->name;
        $category->type = $request->type;
        $category->description = $request->description;
        $saved = $category->save();

        return [$saved, 'Category Created Successfully', $category];
    }

    public function update($request, $id)
    {
        $category = Category::find($id);

        $category->icon = $request->input('icon', $category->icon);
        $category->color = $request->input('color', $category->color);
        $category->name = $request->input('name', $category->name);
        $category->type = $request->input('type', $category->type);
        $category->description = $request->input('description', $category->description);
        $saved = $category->save();

        return [$saved, 'Category Updated Successfully', $category];
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        $deleted = $category->delete();

        return [$deleted, 'Category Deleted Successfully', $category];
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
