<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountResource;
use App\Http\Resources\CategoryResource;
use App\Http\Services\CategoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function __construct(protected CategoryService $service) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection|Response
    {
        [$status, $message, $categories, $accounts] = $this->service->index($request);

        if ($this->shouldReturnJson($request)) {
            return CategoryResource::collection($categories)->additional([
                'status' => $status,
                'message' => $message,
            ]);
        }

        return Inertia::render('categories/index', [
            'categories' => CategoryResource::collection($categories),
            'accounts' => AccountResource::collection($accounts),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request): Response
    {
        $defaultType = $request->string('type')->toString();

        if (! in_array($defaultType, ['expense', 'income'], true)) {
            $defaultType = null;
        }

        return Inertia::render('categories/create', [
            'defaultType' => $defaultType,
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
            'currency' => 'nullable|string|max:10',
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
    public function show(string $id): CategoryResource
    {
        [$status, $message, $category] = $this->service->show($id);

        return (new CategoryResource($category))->additional([
            'status' => $status,
            'message' => $message,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        [$status, $message, $category] = $this->service->show($id);

        return Inertia::render('categories/[id]/edit', [
            'category' => new CategoryResource($category),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): CategoryResource|RedirectResponse
    {
        $request->validate([
            'icon' => 'sometimes|string|max:255',
            'color' => 'sometimes|string|max:255',
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:expense,income',
            'currency' => 'sometimes|string|max:10',
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
    public function destroy(Request $request, string $id): CategoryResource|RedirectResponse
    {
        [$deleted, $message, $category] = $this->service->destroy($id);

        if ($this->shouldReturnJson($request)) {
            return (new CategoryResource($category))->additional([
                'deleted' => $deleted,
                'message' => $message,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect('/categories');
    }
}
