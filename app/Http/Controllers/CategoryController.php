<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Http\Services\CategoryService;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function __construct(protected CategoryService $service) {}

    private function shouldReturnJson(Request $request): bool
    {
        return $request->expectsJson() && !$request->header('X-Inertia');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($this->shouldReturnJson($request)) {
            $categories = $this->service->index($request);

            return CategoryResource::collection($categories);
        }

        $categories = Category::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return Inertia::render('categories/index', [
            'categories' => CategoryResource::collection($categories),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('categories/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'icon' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:expense,income',
            'total' => 'nullable|integer|min:0',
        ]);

        [$saved, $message, $category] = $this->service->store($request);

        if ($this->shouldReturnJson($request)) {
            return (new CategoryResource($category))->additional([
                'saved' => $saved,
                'message' => $message,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect('/categories');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $category = Category::where('user_id', auth()->id())->findOrFail($id);

        return new CategoryResource($category);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $category = Category::where('user_id', auth()->id())->findOrFail($id);

        return Inertia::render('categories/[id]/edit', [
            'category' => new CategoryResource($category),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'icon' => 'sometimes|string|max:255',
            'color' => 'sometimes|string|max:255',
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:expense,income',
            'total' => 'nullable|integer|min:0',
        ]);

        [$saved, $message, $category] = $this->service->update($request, $id);

        if ($this->shouldReturnJson($request)) {
            return (new CategoryResource($category))->additional([
                'saved' => $saved,
                'message' => $message,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect('/categories');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        [$deleted, $message] = $this->service->destroy($id);

        if ($this->shouldReturnJson($request)) {
            return response()->json([
                'deleted' => $deleted,
                'message' => $message,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect('/categories');
    }
}
