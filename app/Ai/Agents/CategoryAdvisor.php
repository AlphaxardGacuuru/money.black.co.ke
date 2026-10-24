<?php

namespace App\Ai\Agents;

use App\Support\CategoryCatalog;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

/**
 * Reviews a user's categories against last month's transactions and proposes
 * a few new categories or clearer names.
 */
#[Provider(Lab::Gemini)]
#[Timeout(60)]
class CategoryAdvisor implements Agent, HasStructuredOutput
{
    use Promptable;

    public const MAX_SUGGESTIONS = 3;

    /**
     * @param  array<int, string>  $categoryIds  The user's category IDs, which rename suggestions must target.
     */
    public function __construct(public array $categoryIds = []) {}

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        $maxSuggestions = self::MAX_SUGGESTIONS;

        return <<<PROMPT
        You help people in Kenya keep their personal budget categories useful.

        You receive the user's categories with last month's totals, and a sample of last month's
        transaction notes with the category each one was recorded under.

        Suggest at most {$maxSuggestions} changes, only where they clearly help:
        - "add": a new category when several transactions share a theme that has no category of its own
          (for example many fuel purchases filed under Transport, or recurring subscriptions filed under Other).
        - "rename": a clearer name for an existing category whose name is vague or misleading. Set category_id
          to that category's id.

        Rules:
        - Never suggest a category that already exists, even with different wording.
        - Keep names short (1-3 words), in Title Case.
        - type is "expense" or "income" and must match the transactions that motivate the suggestion.
        - reason is one short sentence the user will read, mentioning the transactions that led to it.
        - Return an empty list if the categories already work well. Fewer, better suggestions beat more.
        PROMPT;
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        $categoryId = $schema->string()->nullable()->required();

        if ($this->categoryIds !== []) {
            $categoryId->enum([...$this->categoryIds, null]);
        }

        return [
            'suggestions' => $schema->array()->items(
                $schema->object(fn (JsonSchema $schema): array => [
                    'action' => $schema->string()->enum(['add', 'rename'])->required(),
                    'category_id' => $categoryId,
                    'name' => $schema->string()->required(),
                    'type' => $schema->string()->enum(['expense', 'income'])->required(),
                    'icon' => $schema->string()->enum(CategoryCatalog::ICONS)->required(),
                    'reason' => $schema->string()->required(),
                ])
            )->required(),
        ];
    }
}
