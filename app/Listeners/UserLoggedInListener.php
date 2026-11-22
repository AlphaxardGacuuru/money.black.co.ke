<?php

namespace App\Listeners;

use App\Models\User;
use App\Models\UserLogin;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Str;

/**
 * Every way in (Google, password, passkey and the two-factor step) ends in
 * Auth::login(), which fires Login, so they're all recorded here.
 */
class UserLoggedInListener
{
    public function __construct()
    {
        //
    }

    public function handle(Login $event): void
    {
        if (! $event->user instanceof User) {
            return;
        }

        $this->recordLogin($event->user);

        $event->user->markActive();
    }

    /**
     * The method comes from the route that signed the user in. Only the
     * social login callback has a {website} parameter.
     */
    private function recordLogin(User $user): void
    {
        $request = request();

        $user->logins()
            ->create([
                'method' => match ($request->route()?->getName()) {
                    'passkey.login' => UserLogin::METHOD_PASSKEY,
                    'two-factor.login' => UserLogin::METHOD_TWO_FACTOR,
                    default => $request->route()?->parameter('website') ?? UserLogin::METHOD_PASSWORD,
                },
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 1000, ''),
            ]);
    }
}
