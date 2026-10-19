<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\PasskeyLoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Laravel\Passkeys\Actions\GenerateVerificationOptions;
use Laravel\Passkeys\Actions\VerifyPasskey;
use Laravel\Passkeys\Exceptions\InvalidPasskeyException;
use Laravel\Passkeys\Passkeys;
use Laravel\Passkeys\Support\WebAuthn;

class PasskeyLoginController extends Controller
{
    /**
     * Issue a WebAuthn challenge for signing in with a passkey (Face ID, Touch ID, fingerprint, etc.).
     */
    public function options(GenerateVerificationOptions $generate): JsonResponse
    {
        $options = $generate();
        $challengeToken = (string) Str::uuid();

        Cache::put(self::cacheKey($challengeToken), WebAuthn::toJson($options), now()->addMinutes(5));

        return response()->json([
            'options' => WebAuthn::toBrowserArray($options),
            'challenge_token' => $challengeToken,
        ]);
    }

    /**
     * Verify the signed challenge and issue a Sanctum token.
     */
    public function store(PasskeyLoginRequest $request, VerifyPasskey $verify): JsonResponse
    {
        $passkey = $verify($request->credential(), $request->verificationOptions());

        if (! Passkeys::allowsLogin($request, $passkey)) {
            throw InvalidPasskeyException::make('Unable to sign in with this account.');
        }

        /** @var User $user */
        $user = $passkey->user;

        $token = $user->createToken($request->input('device_name') ?: 'web')->plainTextToken;

        return response()->json([
            'message' => 'Logged in',
            'data' => $token,
        ]);
    }

    public static function cacheKey(string $challengeToken): string
    {
        return "passkey_login:{$challengeToken}";
    }
}
