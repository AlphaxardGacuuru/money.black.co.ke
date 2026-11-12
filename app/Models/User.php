<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laragear\TwoFactor\Contracts\TwoFactorAuthenticatable as TwoFactorAuthenticatableContract;
use Laragear\TwoFactor\TwoFactorAuthentication;
use Laravel\Passkeys\Contracts\PasskeyUser;
use Laravel\Passkeys\PasskeyAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;

#[Fillable(['name', 'email', 'password', 'google_id', 'email_verified_at', 'settings', 'avatar'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser, TwoFactorAuthenticatableContract
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasPushSubscriptions, HasUuids, Notifiable, PasskeyAuthenticatable, TwoFactorAuthentication;

    /**
     * The nav routes a user may choose as their home page.
     */
    public const HOME_PAGE_OPTIONS = ['accounts', 'categories', 'transactions', 'overview'];

    /**
     * The home page used when the user hasn't chosen a preference.
     */
    public const DEFAULT_HOME_PAGE = 'categories';

    /**
     * The largest profile picture a user can upload, in kilobytes.
     */
    public const MAX_AVATAR_KB = 5120;

    /**
     * Where uploaded profile pictures live on the public disk.
     */
    public const AVATAR_UPLOAD_DIRECTORY = 'avatars/uploads';

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
     * Serve an uploaded profile picture from the public disk. Google URLs and
     * the default placeholder are returned as stored.
     */
    protected function avatar(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => Str::of((string) $value)
                ->startsWith(static::AVATAR_UPLOAD_DIRECTORY . '/')
                    ? "/storage/{$value}"
                    : $value
        );
    }

    /**
     * Whether the user picked their own profile picture, which Google
     * sign-in then leaves alone.
     */
    public function hasUploadedAvatar(): bool
    {
        return Str::of((string) $this->getRawOriginal('avatar'))
            ->startsWith(static::AVATAR_UPLOAD_DIRECTORY . '/');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    /**
     * Get the user's preferred home page.
     */
    public function homePage(): string
    {
        return $this->settings?->home_page ?? self::DEFAULT_HOME_PAGE;
    }
}
