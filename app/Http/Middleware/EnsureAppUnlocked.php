<?php

namespace App\Http\Middleware;

use App\Support\AppLock;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAppUnlocked
{
    /**
     * Refuse requests from a device that has been idle long enough to lock,
     * and count every other request as activity.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $appLock = AppLock::for($request->user());

        if ($appLock->isLocked()) {
            return response()->json([
                'message' => __('Unlock the app to continue.'),
                'app_locked' => true,
            ], 423);
        }

        $appLock->touch();

        return $next($request);
    }
}
