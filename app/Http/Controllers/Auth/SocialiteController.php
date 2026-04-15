<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Throwable;

class SocialiteController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $exception) {
            report($exception);

            return $this->failedLoginRedirect();
        }

        if (! filled($googleUser->getEmail())) {
            return $this->failedLoginRedirect('Your Google account did not provide an email address.');
        }

        $user = $this->resolveUser($googleUser);

        auth()->login($user, true);
        $request->session()->regenerate();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Signed in with Google successfully.']);

        return redirect()->intended(config('fortify.home'));
    }

    private function resolveUser(SocialiteUser $googleUser): User
    {
        $user = User::query()
            ->where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if ($user) {
            $attributes = [];

            if ($user->google_id !== $googleUser->getId()) {
                $attributes['google_id'] = $googleUser->getId();
            }

            if ($user->email_verified_at === null) {
                $attributes['email_verified_at'] = now();
            }

            if ($attributes !== []) {
                $user->forceFill($attributes)->save();
            }

            return $user;
        }

        return User::create([
            'name' => $googleUser->getName() ?: 'Google User',
            'email' => $googleUser->getEmail(),
            'google_id' => $googleUser->getId(),
            'email_verified_at' => now(),
            'password' => Str::random(40),
        ]);
    }

    private function failedLoginRedirect(?string $message = null): RedirectResponse
    {
        return redirect()
            ->route('login')
            ->withErrors([
                'socialite' => $message ?? 'Unable to sign in with Google. Please try again.',
            ]);
    }
}
