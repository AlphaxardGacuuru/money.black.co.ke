<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
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
            'last_active_at' => 'datetime',
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

    public function logins(): HasMany
    {
        return $this->hasMany(UserLogin::class);
    }

    /**
     * Users whose name or email contains the term, grouped so it can be
     * combined with other conditions.
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(fn (Builder $query) => $query
            ->where('name', 'like', "%{$term}%")
            ->orWhere('email', 'like', "%{$term}%"));
    }

    /**
     * Get the user's preferred home page.
     */
    public function homePage(): string
    {
        return $this->settings?->home_page ?? self::DEFAULT_HOME_PAGE;
    }

    /**
     * How long last_active_at may lag behind, so an active user only costs
     * one write every few minutes (see TrackUserActivity).
     */
    public const ACTIVITY_INTERVAL_MINUTES = 5;

    /**
     * Note that the user is using the app, at most once every
     * ACTIVITY_INTERVAL_MINUTES. Leaves updated_at alone, since nothing
     * about the account itself changed.
     */
    public function markActive(): void
    {
        if ($this->last_active_at?->gt(now()->subMinutes(self::ACTIVITY_INTERVAL_MINUTES))) {
            return;
        }

        static::withoutTimestamps(fn () => $this
            ->forceFill(['last_active_at' => now()])
            ->saveQuietly());
    }

    /**
     * Users who used the app in the last day, week and month.
     *
     * @return array{day: int, week: int, month: int}
     */
    public static function activeCounts(): array
    {
        $counts = static::query()
            ->toBase()
            ->selectRaw('SUM(CASE WHEN last_active_at >= ? THEN 1 ELSE 0 END) as day', [now()->subDay()])
            ->selectRaw('SUM(CASE WHEN last_active_at >= ? THEN 1 ELSE 0 END) as week', [now()->subWeek()])
            ->selectRaw('SUM(CASE WHEN last_active_at >= ? THEN 1 ELSE 0 END) as month', [now()->subMonth()])
            ->first();

        return [
            'day' => (int) $counts->day,
            'week' => (int) $counts->week,
            'month' => (int) $counts->month,
        ];
    }
}
