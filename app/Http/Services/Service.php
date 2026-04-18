<?php

namespace App\Http\Services;

use Carbon\Carbon;
use Illuminate\Http\Request;

class Service
{
    protected function resolveDateRange(Request $request): ?array
    {
        $filter = $request->input('filter', 'all_time');

        $now = now();

        return match ($filter) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            'date' => [Carbon::parse($request->input('date'))->startOfDay(), Carbon::parse($request->input('date'))->endOfDay()],
            'dateRange' => [Carbon::parse($request->input('startDate'))->startOfDay(), Carbon::parse($request->input('endDate'))->endOfDay()],
            default => null,
        };
    }
}
