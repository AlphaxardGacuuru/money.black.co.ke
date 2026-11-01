<?php

namespace App\Http\Controllers;

use App\Models\MonthlySummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonthlySummaryController extends Controller
{
    /**
     * The AI summary for a month, or null if there isn't one (yet).
     */
    public function show(Request $request, string $period): JsonResponse
    {
        abort_unless(preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $period), 404);

        $summary = MonthlySummary::query()
            ->where('user_id', $request->user()->id)
            ->where('period', $period)
            ->first();

        return response()->json([
            'data' => $summary ? [
                'period' => $summary->period,
                'headline' => $summary->headline,
                'summary' => $summary->summary,
                'generatedAt' => $summary->updated_at->toIso8601String(),
            ] : null,
        ]);
    }
}
