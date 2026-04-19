<?php

namespace App\Http\Controllers;

use App\Http\Services\OneMoneyImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OneMoneyImportController extends Controller
{
    public function __construct(protected OneMoneyImportService $service) {}

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        [$status, $message, $summary] = $this->service->import($request);

        return response()->json([
            'status' => $status,
            'message' => $message,
            'summary' => $summary,
        ]);
    }
}
