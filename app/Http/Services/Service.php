<?php

namespace App\Http\Services;

use Carbon\Carbon;
use Illuminate\Http\Request;

class Service
{
    protected function resolveDateRange(Request $request): ?array
    {
        $filter = $request->input('filter', 'all_time');

        $referenceDate = $request->filled('date')
            ? Carbon::parse($request->input('date'))
            : now();

        return match ($filter) {
            'today' => [$referenceDate->copy()->startOfDay(), $referenceDate->copy()->endOfDay()],
            'week' => [$referenceDate->copy()->startOfWeek(), $referenceDate->copy()->endOfWeek()],
            'month' => [$referenceDate->copy()->startOfMonth(), $referenceDate->copy()->endOfMonth()],
            'year' => [$referenceDate->copy()->startOfYear(), $referenceDate->copy()->endOfYear()],
            'date' => [Carbon::parse($request->input('date'))->startOfDay(), Carbon::parse($request->input('date'))->endOfDay()],
            'dateRange' => [Carbon::parse($request->input('startDate'))->startOfDay(), Carbon::parse($request->input('endDate'))->endOfDay()],
            default => null,
        };
    }
}
