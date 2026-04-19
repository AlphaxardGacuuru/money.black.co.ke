<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Http\Services\CategoryService;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function __construct(protected CategoryService $service) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        [$status, $message, $categories] = $this->service->index($request);

        return CategoryResource::collection($categories)->additional([
            'status' => $status,
            'message' => $message,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): CategoryResource|RedirectResponse
    {
        $request->validate([
            'icon' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:expense,income',
            'total' => 'nullable|integer|min:0',
        ]);

        [$saved, $message, $category] = $this->service->store($request);

        return (new CategoryResource($category))->additional([
            'saved' => $saved,
            'message' => $message,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category): CategoryResource
    {
        return (new CategoryResource($category))->additional([
            'status' => true,
            'message' => 'Category Retrieved Successfully',
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category): CategoryResource|RedirectResponse
    {
        $request->validate([
            'icon' => 'sometimes|string|max:255',
            'color' => 'sometimes|string|max:255',
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:expense,income',
            'total' => 'nullable|integer|min:0',
        ]);

        [$saved, $message, $category] = $this->service->update($request, $category);

        return (new CategoryResource($category))->additional([
            'saved' => $saved,
            'message' => $message,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category): CategoryResource|RedirectResponse
    {
        [$deleted, $message, $category] = $this->service->destroy($category);

        return (new CategoryResource($category))->additional([
            'deleted' => $deleted,
            'message' => $message,
        ]);
    }
}
