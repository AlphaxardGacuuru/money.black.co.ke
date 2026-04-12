<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Http\Services\CategoryService;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(protected CategoryService $service)
    {
        // 
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
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
    public function store(Request $request)
    {
        $this->validate($request, [
            'icon' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:expense,income',
            'description' => 'nullable|string|max:255',
        ]);

        [$status, $message, $category] = $this->service->store($request);

        return (new CategoryResource($category))->additional([
            'status' => $status,
            'message' => $message,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        [$status, $message, $category] = $this->service->show($id);

        return (new CategoryResource($category))->additional([
            'status' => $status,
            'message' => $message,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'icon' => 'sometimes|string|max:255',
            'color' => 'sometimes|string|max:255',
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:expense,income',
            'description' => 'nullable|string|max:255',
        ]);

        [$status, $message, $category] = $this->service->update($request, $id);

        return (new CategoryResource($category))->additional([
            'status' => $status,
            'message' => $message,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        [$status, $message, $category] = $this->service->destroy($id);

        return (new CategoryResource($category))->additional([
            'status' => $status,
            'message' => $message,
        ]);
    }
}