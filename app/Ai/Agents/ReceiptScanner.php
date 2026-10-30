<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

/**
 * Reads a receipt image or PDF and returns its line items, each matched to one
 * of the user's expense categories.
 */
#[Provider(Lab::Gemini)]
#[Timeout(90)]
class ReceiptScanner implements Agent, HasStructuredOutput
{
    use Promptable;

    /**
     * @param  array<int, array{id: string, name: string}>  $categories
     */
    public function __construct(public array $categories = []) {}

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        $categoryList = collect($this->categories)
            ->map(fn (array $category): string => "- {$category['id']}: {$category['name']}")
            ->implode("\n");

        return <<<PROMPT
        You read shopping receipts for a personal finance app used mostly in Kenya.

        Extract exactly what is printed on the receipt:
        - merchant: the shop or business name.
        - date: the purchase date as YYYY-MM-DD. Use null if it is not printed or unreadable.
        - currency: the ISO 4217 code. Assume KES unless another currency is printed.
        - total: the final amount paid, after tax and discounts.
        - tax and discount: the totals printed on the receipt, or null if none are shown.
        - items: one entry per purchased line. "amount" is the line total (quantity x unit price) as printed.
          Do not include subtotal, tax, discount, change, tendered cash, or payment lines as items.
        - description: what a shopper would call the item, e.g. "Dorm 3-in-1" for "DORM.3IN1 IR18GX12".
          Read the whole printed line to work out the item, then leave out product codes, SKUs, barcodes and
          other internal codes that mean nothing to a shopper. Keep sizes and pack counts that are clear,
          like 500ml, 2kg or x12. If you can't tell what part of the line is a code, keep the line as printed.

        Amounts are plain numbers without currency symbols or thousands separators.

        Assign each item the category_id of the best matching category below, or null if none fits:
        {$categoryList}

        If the image is not a receipt or invoice, or is too unclear to read, set is_receipt to false and return no items.
        Never guess numbers you cannot read.
        PROMPT;
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        $categoryId = $schema->string()->nullable()->required();

        if ($this->categories !== []) {
            $categoryId->enum([...array_column($this->categories, 'id'), null]);
        }

        return [
            'is_receipt' => $schema->boolean()->required(),
            'merchant' => $schema->string()->nullable()->required(),
            'date' => $schema->string()->nullable()->description('YYYY-MM-DD')->required(),
            'currency' => $schema->string()->nullable()->required(),
            'total' => $schema->number()->nullable()->required(),
            'tax' => $schema->number()->nullable()->required(),
            'discount' => $schema->number()->nullable()->required(),
            'items' => $schema->array()->items(
                $schema->object(fn (JsonSchema $schema): array => [
                    'description' => $schema->string()->required(),
                    'quantity' => $schema->number()->required(),
                    'amount' => $schema->number()->required(),
                    'category_id' => $categoryId,
                ])
            )->required(),
        ];
    }
}
