<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasskeyConfirmationRequest;
use App\Support\PasskeyActionConfirmation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Laravel\Passkeys\Actions\GenerateVerificationOptions;
use Laravel\Passkeys\Actions\VerifyPasskey;
use Laravel\Passkeys\Support\WebAuthn;

class PasskeyConfirmationController extends Controller
{
    /**
     * Report whether the current token has a recent confirmation and which methods are available.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $localPart = Str::before($user->email, '@');

        return response()->json([
            'confirmed' => PasskeyActionConfirmation::for($user)->isConfirmed(),
            'methods' => $user->hasPasskeysEnabled() ? ['passkey', 'email'] : ['email'],
            'email' => Str::substr($localPart, 0, 1) . str_repeat('*', max(Str::length($localPart) - 1, 3)) . '@' . Str::after($user->email, '@'),
        ]);
    }

    /**
     * Issue a WebAuthn challenge restricted to the user's own passkeys.
     */
    public function options(Request $request, GenerateVerificationOptions $generate): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->hasPasskeysEnabled(), 422, __('You have no passkeys to confirm with.'));

        $options = $generate($user);

        Cache::put(
            PasskeyActionConfirmation::for($user)->verificationOptionsKey(),
            WebAuthn::toJson($options),
            now()->addMinutes(5),
        );

        return response()->json(['options' => WebAuthn::toBrowserArray($options)]);
    }

    /**
     * Confirm identity with one of the user's existing passkeys.
     */
    public function store(PasskeyConfirmationRequest $request, VerifyPasskey $verify): JsonResponse
    {
        $user = $request->user();

        $verify($request->credential(), $request->verificationOptions(), $user);

        PasskeyActionConfirmation::for($user)->markConfirmed();

        return response()->json(['message' => __('Identity confirmed.')]);
    }

    /**
     * Email a one-time confirmation code to the user.
     */
    public function sendEmailCode(Request $request): JsonResponse
    {
        PasskeyActionConfirmation::for($request->user())->sendEmailCode();

        return response()->json(['message' => __('We\'ve emailed you a 6-digit code.')]);
    }

    /**
     * Confirm identity with the emailed code.
     */
    public function verifyEmailCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'digits:6'],
        ]);

        PasskeyActionConfirmation::for($request->user())->verifyEmailCode($validated['code']);

        return response()->json(['message' => __('Identity confirmed.')]);
    }
}
