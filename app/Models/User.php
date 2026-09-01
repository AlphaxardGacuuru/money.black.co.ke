<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laragear\TwoFactor\Contracts\TwoFactorAuthenticatable as TwoFactorAuthenticatableContract;
use Laragear\TwoFactor\TwoFactorAuthentication;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'google_id', 'email_verified_at', 'settings', 'avatar'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements TwoFactorAuthenticatableContract
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable, TwoFactorAuthentication;

    /**
     * The nav routes a user may choose as their home page.
     */
    public const HOME_PAGE_OPTIONS = ['accounts', 'categories', 'transactions', 'overview'];

    /**
     * The home page used when the user hasn't chosen a preference.
     */
    public const DEFAULT_HOME_PAGE = 'categories';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'settings' => 'object',
        ];
    }

    /**
     * Get the user's preferred home page.
     */
    public function homePage(): string
    {
        return $this->settings?->home_page ?? self::DEFAULT_HOME_PAGE;
    }
}
