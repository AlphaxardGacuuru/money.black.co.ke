<?php

namespace App\Http\Middleware;

use App\Support\PasskeyActionConfirmation;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasskeyActionConfirmed
{
    /**
     * Require a recent identity confirmation before passkeys can be added or removed.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! PasskeyActionConfirmation::for($user)->isConfirmed()) {
            return response()->json([
                'message' => __('Please confirm it\'s you before changing biometric login.'),
                'confirmation_required' => true,
                'methods' => $user->hasPasskeysEnabled() ? ['passkey', 'email'] : ['email'],
            ], 423);
        }

        return $next($request);
    }
}
