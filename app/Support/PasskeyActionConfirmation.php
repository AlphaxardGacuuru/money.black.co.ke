<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\PasskeyConfirmationCodeNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Tracks the short-lived "identity confirmed" state required before a user may
 * add or remove passkeys. Accounts sign in via Google, so there is no password
 * to re-enter; users confirm with an existing passkey or an emailed code instead.
 */
class PasskeyActionConfirmation
{
    public const CONFIRMATION_MINUTES = 10;

    public const CODE_MINUTES = 10;

    public const MAX_CODE_ATTEMPTS = 5;

    public function __construct(private User $user) {}

    public static function for(User $user): self
    {
        return new self($user);
    }

    public function isConfirmed(): bool
    {
        return Cache::has($this->key('confirmed'));
    }

    public function markConfirmed(): void
    {
        Cache::put($this->key('confirmed'), now()->timestamp, now()->addMinutes(self::CONFIRMATION_MINUTES));
    }

    /**
     * Generate a one-time code and email it to the user.
     */
    public function sendEmailCode(): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put($this->key('code'), [
            'hash' => Hash::make($code),
            'attempts' => 0,
        ], now()->addMinutes(self::CODE_MINUTES));

        $this->user->notify(new PasskeyConfirmationCodeNotification($code, self::CODE_MINUTES));
    }

    /**
     * Check an emailed code, marking the action confirmed when it matches.
     *
     * @throws ValidationException
     */
    public function verifyEmailCode(string $code): void
    {
        /** @var array{hash: string, attempts: int}|null $pending */
        $pending = Cache::get($this->key('code'));

        if (! $pending) {
            throw ValidationException::withMessages(['code' => __('This code has expired. Please request a new one.')]);
        }

        if (! Hash::check($code, $pending['hash'])) {
            $pending['attempts']++;

            if ($pending['attempts'] >= self::MAX_CODE_ATTEMPTS) {
                Cache::forget($this->key('code'));

                throw ValidationException::withMessages(['code' => __('Too many incorrect attempts. Please request a new code.')]);
            }

            Cache::put($this->key('code'), $pending, now()->addMinutes(self::CODE_MINUTES));

            throw ValidationException::withMessages(['code' => __('The code you entered is incorrect.')]);
        }

        Cache::forget($this->key('code'));

        $this->markConfirmed();
    }

    public function verificationOptionsKey(): string
    {
        return $this->key('options');
    }

    /**
     * Scope state to the current API token (or web session) so confirming on one device does not unlock another.
     */
    private function key(string $suffix): string
    {
        $token = CurrentAccessToken::for($this->user);
        $scope = $token ? "token:{$token->getKey()}" : 'session:' . request()->session()->getId();

        return "passkey_action:{$this->user->getKey()}:{$scope}:{$suffix}";
    }
}
