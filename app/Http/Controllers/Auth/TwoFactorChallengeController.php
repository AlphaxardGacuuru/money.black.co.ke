<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class TwoFactorChallengeController extends Controller
{
    /**
     * Failed codes allowed per user per minute. Counted per user rather than per
     * pending token, since logging in again hands out a fresh token.
     */
    public const MAX_ATTEMPTS = 5;

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'pending_token' => 'required|string',
            'code' => 'required|string',
        ]);

        $userId = Cache::get("2fa_pending:{$request->pending_token}");

        if (! $userId) {
            throw ValidationException::withMessages(['pending_token' => ['This session has expired. Please log in again.']]);
        }

        $user = User::find($userId);

        if (! $user) {
            Cache::forget("2fa_pending:{$request->pending_token}");
            throw ValidationException::withMessages(['code' => ['User not found.']]);
        }

        $attemptsKey = "2fa_challenge:{$user->id}";

        if (RateLimiter::tooManyAttempts($attemptsKey, self::MAX_ATTEMPTS)) {
            throw ValidationException::withMessages(['code' => [__('Too many attempts. Please try again in :seconds seconds.', ['seconds' => RateLimiter::availableIn($attemptsKey)])]]);
        }

        if (! $user->validateTwoFactorCode($request->code, true)) {
            RateLimiter::hit($attemptsKey);

            throw ValidationException::withMessages(['code' => ['The provided two-factor authentication code is incorrect.']]);
        }

        RateLimiter::clear($attemptsKey);
        Cache::forget("2fa_pending:{$request->pending_token}");

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'message' => 'Logged in',
            'data' => $token,
        ]);
    }
}
