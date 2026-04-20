<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

class UsePersistentAuthSession
{
    public const COOKIE_NAME = 'persistent_auth_session';

    public const PERSISTENT_LIFETIME_MINUTES = 5_256_000;

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldUsePersistentSession($request)) {
            config([
                'session.lifetime' => self::PERSISTENT_LIFETIME_MINUTES,
                'session.expire_on_close' => false,
            ]);
        }

        return $next($request);
    }

    public static function queuePersistentCookie(): void
    {
        Cookie::queue(Cookie::forever(
            self::COOKIE_NAME,
            '1',
            path: config('session.path'),
            domain: config('session.domain'),
            secure: config('session.secure'),
            httpOnly: config('session.http_only'),
            sameSite: config('session.same_site'),
        ));
    }

    public static function queueForgetPersistentCookie(): void
    {
        Cookie::queue(Cookie::forget(
            self::COOKIE_NAME,
            path: config('session.path'),
            domain: config('session.domain'),
        ));
    }

    private function shouldUsePersistentSession(Request $request): bool
    {
        return $this->hasPersistentSessionCookie($request)
            || $this->isRememberLoginAttempt($request)
            || $this->isGoogleCallback($request);
    }

    private function hasPersistentSessionCookie(Request $request): bool
    {
        return $request->cookie(self::COOKIE_NAME) === '1';
    }

    private function isRememberLoginAttempt(Request $request): bool
    {
        return $request->isMethod('post')
            && $request->is('login')
            && $request->boolean('remember');
    }

    private function isGoogleCallback(Request $request): bool
    {
        return $request->isMethod('get')
            && $request->is('login/google/callback');
    }
}
