<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Support\AppLock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AppLockController extends Controller
{
    /**
     * Turn the app lock on or off for the user.
     *
     * @throws ValidationException
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        $user = $request->user();

        if ($validated['enabled'] && ! $user->hasPasskeysEnabled()) {
            throw ValidationException::withMessages(['enabled' => __('Add a passkey before turning on the app lock.')]);
        }

        $settings = $user->settings ?? new \stdClass;
        $settings->app_lock = $validated['enabled'];
        $user->settings = $settings;
        $user->save();

        AppLock::for($user)->touch();

        return response()->json([
            'message' => $validated['enabled'] ? __('App lock turned on.') : __('App lock turned off.'),
        ]);
    }
}
