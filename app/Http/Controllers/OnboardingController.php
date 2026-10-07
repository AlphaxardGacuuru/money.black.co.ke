<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function completePermissions(Request $request): JsonResponse
    {
        $user = $request->user();

        // Merge rather than replace: settings may already hold unrelated
        // keys (theme, other future onboarding steps, ...).
        $settings = (array) ($user->settings ?? []);
        $settings['permissionsOnboardedAt'] = now()->toIso8601String();
        $user->settings = $settings;
        $user->save();

        return response()->json([
            'data' => UserResource::make($user),
        ]);
    }
}
