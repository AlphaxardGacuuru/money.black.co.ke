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
 * Turns a month's pre-calculated spending figures into a short, plain-language
 * summary. It is never asked to do arithmetic.
 */
#[Provider(Lab::Gemini)]
#[Timeout(60)]
class SpendingSummarizer implements Agent, HasStructuredOutput
{
    use Promptable;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
        You write a short monthly money summary for a personal finance app used mostly in Kenya.

        You receive one month of figures as JSON: total spending and income, the previous month's totals,
        the percentage changes, spending per category with its change from the previous month, and the
        largest individual expenses.

        Write:
        - headline: at most 8 words naming the most important thing about the month.
        - summary: 2 to 4 sentences covering how much was spent compared with last month, which categories
          drove the change, and anything notable in the largest expenses.

        Rules:
        - Use only the figures given. Never calculate, estimate or invent numbers.
        - Write amounts like "KES 48,200" and percentages as given, e.g. "12% more".
        - When there is no previous month, describe the month on its own without comparing.
        - Speak to the user as "you". Be plain and neutral: no praise, no scolding, no financial advice.
        PROMPT;
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'headline' => $schema->string()->required(),
            'summary' => $schema->string()->required(),
        ];
    }
}
