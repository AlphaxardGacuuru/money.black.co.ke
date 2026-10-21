<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Resolves the Sanctum personal access token behind the current request.
 *
 * Sanctum checks the `web` session guard before bearer tokens, so once a user
 * also has a web session, `currentAccessToken()` returns a TransientToken even
 * when a bearer token was sent. This falls back to the Authorization header.
 */
class CurrentAccessToken
{
    public static function for(User $user, ?Request $request = null): ?PersonalAccessToken
    {
        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            return $token;
        }

        $bearerToken = ($request ?? request())->bearerToken();

        if (! $bearerToken) {
            return null;
        }

        $token = PersonalAccessToken::findToken($bearerToken);

        return $token?->tokenable()->is($user) ? $token : null;
    }
}
