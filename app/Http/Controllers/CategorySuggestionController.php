<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Http\Services\CategorySuggestionService;
use App\Models\CategorySuggestion;
use App\Support\CategoryCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategorySuggestionController extends Controller
{
    public function __construct(protected CategorySuggestionService $service) {}

    /**
     * The starter categories and any pending monthly suggestions.
     */
    public function index(Request $request): JsonResponse
    {
        $suggestions = CategorySuggestion::query()
            ->where('user_id', $request->user()->id)
            ->where('status', CategorySuggestion::STATUS_PENDING)
            ->with('category:id,name')
            ->latest()
            ->get();

        return response()->json([
            'starter' => CategoryCatalog::STARTER,
            'suggestions' => $suggestions->map(fn (CategorySuggestion $suggestion): array => [
                'id' => $suggestion->id,
                'action' => $suggestion->action,
                'name' => $suggestion->name,
                'type' => $suggestion->type,
                'icon' => $suggestion->icon,
                'color' => $suggestion->color,
                'reason' => $suggestion->reason,
                'categoryId' => $suggestion->category_id,
                'currentName' => $suggestion->category?->name,
                'period' => $suggestion->period,
            ]),
        ]);
    }

    /**
     * Create the starter categories the user picked.
     */
    public function storeStarter(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'names' => ['required', 'array', 'min:1'],
            'names.*' => ['required', 'string', Rule::in(array_column(CategoryCatalog::STARTER, 'name'))],
        ]);

        $categories = $this->service->createStarterCategories($request->user(), $validated['names']);

        return response()->json([
            'message' => trans_choice('{0} You already have these categories.|{1} Added :count category.|[2,*] Added :count categories.', $categories->count()),
            'data' => CategoryResource::collection($categories),
        ], $categories->isEmpty() ? 200 : 201);
    }

    /**
     * Apply a monthly suggestion.
     */
    public function accept(CategorySuggestion $suggestion): JsonResponse
    {
        $this->authorize('update', $suggestion);

        $category = $this->service->accept($suggestion);

        return response()->json([
            'message' => $suggestion->action === CategorySuggestion::ACTION_RENAME
                ? __('Category renamed to :name.', ['name' => $category->name])
                : __('Added :name.', ['name' => $category->name]),
            'data' => new CategoryResource($category),
        ]);
    }

    /**
     * Dismiss a monthly suggestion so it isn't offered again.
     */
    public function dismiss(CategorySuggestion $suggestion): JsonResponse
    {
        $this->authorize('update', $suggestion);

        $this->service->dismiss($suggestion);

        return response()->json(['message' => __('Suggestion dismissed.')]);
    }
}
