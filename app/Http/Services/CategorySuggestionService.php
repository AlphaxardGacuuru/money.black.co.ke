<?php

namespace App\Http\Services;

use App\Ai\Agents\CategoryAdvisor;
use App\Models\Category;
use App\Models\CategorySuggestion;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\CategorySuggestionsReady;
use App\Support\CategoryCatalog;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CategorySuggestionService extends Service
{
    /**
     * Users with fewer transactions in the month are skipped: there isn't
     * enough to learn from, and it keeps the monthly AI bill down.
     */
    public const MIN_TRANSACTIONS = 5;

    /**
     * How many transaction notes are sent to the AI, newest first.
     */
    public const MAX_NOTES = 60;

    /**
     * Create the chosen starter categories, skipping any the user already has.
     *
     * @param  array<int, string>  $names
     * @return Collection<int, Category>
     */
    public function createStarterCategories(User $user, array $names): Collection
    {
        $catalog = CategoryCatalog::starterByName();

        return DB::transaction(function() use ($user, $names, $catalog) {
            $existing = $this->normalizedCategoryNames($user);
            $position = Category::query()->where('user_id', $user->id)->count();
            $created = collect();

            foreach (array_unique($names) as $name) {
                $preset = $catalog[$name] ?? null;

                if (! $preset || in_array($this->normalize($name), $existing, true)) {
                    continue;
                }

                $created->push($this->createCategory($user, $preset['name'], $preset['type'], $preset['icon'], $preset['color'], ++$position));
            }

            return $created;
        });
    }

    /**
     * Ask the AI to review last month's categories and store its suggestions.
     *
     * @param  string  $period  The month to review, as YYYY-MM.
     * @return int The number of suggestions saved.
     */
    public function generateMonthlySuggestions(User $user, string $period): int
    {
        $month = CarbonImmutable::createFromFormat('Y-m', $period)->startOfMonth();

        $transactions = Transaction::query()
            ->where('user_id', $user->id)
            ->whereBetween('transaction_date', [$month, $month->endOfMonth()])
            ->with('category:id,name,type')
            ->latest('transaction_date')
            ->get(['id', 'category_id', 'amount', 'notes', 'transaction_date']);

        if ($transactions->count() < self::MIN_TRANSACTIONS) {
            return 0;
        }

        $categories = Category::query()->where('user_id', $user->id)->orderBy('position')->get(['id', 'name', 'type']);

        $response = (new CategoryAdvisor($categories->pluck('id')->map(fn ($id): string => (string) $id)->all()))
            ->prompt($this->buildReviewPrompt($month, $categories, $transactions));

        $suggestions = $this->filterSuggestions($user, $categories, $response['suggestions'] ?? []);

        DB::transaction(function() use ($user, $suggestions, $period) {
            CategorySuggestion::query()
                ->where('user_id', $user->id)
                ->where('status', CategorySuggestion::STATUS_PENDING)
                ->delete();

            foreach ($suggestions as $suggestion) {
                CategorySuggestion::create([...$suggestion, 'user_id' => $user->id, 'period' => $period]);
            }
        });

        if ($suggestions->isNotEmpty()) {
            $user->notify(new CategorySuggestionsReady($suggestions->count()));
        }

        return $suggestions->count();
    }

    /**
     * Apply a suggestion: create the new category or rename the existing one.
     *
     * @throws ValidationException
     */
    public function accept(CategorySuggestion $suggestion): ?Category
    {
        return DB::transaction(function() use ($suggestion) {
            $suggestion = CategorySuggestion::query()->lockForUpdate()->findOrFail($suggestion->id);

            if (! $suggestion->isPending()) {
                throw ValidationException::withMessages(['suggestion' => __('This suggestion has already been handled.')]);
            }

            $user = $suggestion->user;

            if (in_array($this->normalize($suggestion->name), $this->normalizedCategoryNames($user), true)) {
                throw ValidationException::withMessages(['suggestion' => __('You already have a category called :name.', ['name' => $suggestion->name])]);
            }

            if ($suggestion->action === CategorySuggestion::ACTION_RENAME) {
                $category = Category::query()->where('user_id', $user->id)->findOrFail($suggestion->category_id);
                $category->name = $suggestion->name;
                $category->save();
            } else {
                $position = Category::query()->where('user_id', $user->id)->count() + 1;
                $category = $this->createCategory($user, $suggestion->name, $suggestion->type, $suggestion->icon, $suggestion->color, $position);
            }

            $suggestion->update(['status' => CategorySuggestion::STATUS_ACCEPTED, 'resolved_at' => now()]);

            return $category;
        });
    }

    public function dismiss(CategorySuggestion $suggestion): void
    {
        if (! $suggestion->isPending()) {
            return;
        }

        $suggestion->update(['status' => CategorySuggestion::STATUS_DISMISSED, 'resolved_at' => now()]);
    }

    /**
     * Summarise the month as compact JSON for the advisor.
     *
     * @param  Collection<int, Category>  $categories
     * @param  Collection<int, Transaction>  $transactions
     */
    private function buildReviewPrompt(CarbonImmutable $month, Collection $categories, Collection $transactions): string
    {
        $byCategory = $transactions->groupBy('category_id');

        $categorySummary = $categories->map(fn (Category $category): array => [
            'id' => (string) $category->id,
            'name' => $category->name,
            'type' => $category->type,
            'transactions' => $byCategory->get($category->id)?->count() ?? 0,
            'total' => (int) ($byCategory->get($category->id)?->sum('amount') ?? 0),
        ])->values();

        $notes = $transactions
            ->filter(fn (Transaction $transaction): bool => filled($transaction->notes))
            ->unique(fn (Transaction $transaction): string => Str::lower(trim($transaction->notes)))
            ->take(self::MAX_NOTES)
            ->map(fn (Transaction $transaction): array => [
                'note' => Str::limit(trim($transaction->notes), 80),
                'category' => $transaction->category?->name,
                'amount' => (int) $transaction->amount,
            ])
            ->values();

        return 'Month: ' . $month->format('F Y') . "\n"
            . 'Categories: ' . json_encode($categorySummary, JSON_UNESCAPED_UNICODE) . "\n"
            . 'Transaction notes: ' . json_encode($notes, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Keep only suggestions that are new, valid and not previously dismissed.
     *
     * @param  Collection<int, Category>  $categories
     * @param  array<int, array<string, mixed>>  $rawSuggestions
     * @return Collection<int, array<string, mixed>>
     */
    private function filterSuggestions(User $user, Collection $categories, array $rawSuggestions): Collection
    {
        $existingNames = $categories->map(fn (Category $category): string => $this->normalize($category->name))->all();
        $categoriesById = $categories->keyBy(fn (Category $category): string => (string) $category->id);

        $dismissed = CategorySuggestion::query()
            ->where('user_id', $user->id)
            ->where('status', CategorySuggestion::STATUS_DISMISSED)
            ->get(['action', 'category_id', 'name'])
            ->map(fn (CategorySuggestion $suggestion): string => $this->suggestionKey($suggestion->action, $suggestion->category_id, $suggestion->name))
            ->all();

        $seen = [];

        return collect($rawSuggestions)
            ->map(function(array $raw) use ($categoriesById): ?array {
                $action = $raw['action'] ?? null;
                $name = Str::title(Str::limit(trim((string) ($raw['name'] ?? '')), 50, ''));

                if (! in_array($action, [CategorySuggestion::ACTION_ADD, CategorySuggestion::ACTION_RENAME], true) || $name === '') {
                    return null;
                }

                $category = $action === CategorySuggestion::ACTION_RENAME
                    ? $categoriesById->get((string) ($raw['category_id'] ?? ''))
                    : null;

                if ($action === CategorySuggestion::ACTION_RENAME && ! $category) {
                    return null;
                }

                $type = $category?->type ?? (in_array($raw['type'] ?? null, ['expense', 'income'], true) ? $raw['type'] : 'expense');

                return [
                    'action' => $action,
                    'category_id' => $category?->id,
                    'name' => $name,
                    'type' => $type,
                    'icon' => CategoryCatalog::iconOrDefault($raw['icon'] ?? null),
                    'color' => CategoryCatalog::colorFor($name),
                    'reason' => Str::limit(trim((string) ($raw['reason'] ?? '')), 250, '') ?: null,
                ];
            })
            ->filter()
            ->filter(function(array $suggestion) use ($existingNames, $dismissed, &$seen): bool {
                $key = $this->suggestionKey($suggestion['action'], $suggestion['category_id'], $suggestion['name']);

                if (in_array($this->normalize($suggestion['name']), $existingNames, true) || in_array($key, $dismissed, true) || isset($seen[$key])) {
                    return false;
                }

                return $seen[$key] = true;
            })
            ->take(CategoryAdvisor::MAX_SUGGESTIONS)
            ->values();
    }

    private function createCategory(User $user, string $name, string $type, string $icon, string $color, int $position): Category
    {
        $category = new Category;
        $category->user_id = $user->id;
        $category->name = $name;
        $category->type = $type;
        $category->icon = $icon;
        $category->color = $color;
        $category->position = $position;
        $category->total = 0;
        $category->save();

        return $category;
    }

    /**
     * @return array<int, string>
     */
    private function normalizedCategoryNames(User $user): array
    {
        return Category::query()
            ->where('user_id', $user->id)
            ->pluck('name')
            ->map(fn (string $name): string => $this->normalize($name))
            ->all();
    }

    /**
     * Compare names loosely: "Airtime & Data", "airtime and data" and "Airtime/Data" match.
     */
    private function normalize(string $name): string
    {
        return preg_replace('/[^a-z0-9]/', '', str_replace(['&', ' and '], '', Str::lower(" {$name} "))) ?? '';
    }

    private function suggestionKey(string $action, ?string $categoryId, string $name): string
    {
        return $action . '|' . ($categoryId ?? '') . '|' . $this->normalize($name);
    }
}
