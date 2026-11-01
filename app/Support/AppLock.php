<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * Opt-in app lock: once a device has been idle for a day, the user must unlock
 * it with a passkey before the API answers again. Users without a passkey are
 * never locked, and a freshly issued token starts unlocked since signing in is
 * itself proof of identity.
 */
class AppLock
{
    public const IDLE_MINUTES = 60 * 24;

    public function __construct(private User $user) {}

    public static function for(User $user): self
    {
        return new self($user);
    }

    public function isEnabled(): bool
    {
        return (bool) ($this->user->settings?->app_lock ?? false) && $this->user->hasPasskeysEnabled();
    }

    public function isLocked(): bool
    {
        if (! $this->isEnabled() || Cache::has($this->key())) {
            return false;
        }

        $token = CurrentAccessToken::for($this->user);

        return ! $token?->created_at?->isAfter(now()->subMinutes(self::IDLE_MINUTES));
    }

    /**
     * Record activity on this device, keeping it unlocked for another idle window.
     */
    public function touch(): void
    {
        Cache::put($this->key(), now()->timestamp, now()->addMinutes(self::IDLE_MINUTES));
    }

    /**
     * Scope state to the current API token (or web session) so unlocking one device does not unlock another.
     */
    private function key(): string
    {
        $token = CurrentAccessToken::for($this->user);
        $scope = $token ? "token:{$token->getKey()}" : 'session:' . request()->session()->getId();

        return "app_lock:{$this->user->getKey()}:{$scope}:active";
    }
}
