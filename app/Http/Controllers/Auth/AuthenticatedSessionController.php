<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Notifications\WelcomeNotification;
use App\Support\CurrentAccessToken;
use Exception;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse;

class AuthenticatedSessionController extends Controller
{
    /*
     * Social Logins*/
    public function redirectToProvider(string $website): RedirectResponse
    {
        return Socialite::driver($website)->redirect();
    }

    /**
     * Obtain the user information from a social provider, start a web session and issue a Sanctum token.
     */
    public function handleProviderCallback(Request $request, string $website): RedirectResponse
    {
        try {
            $socialUser = Socialite::driver($website)->stateless()->user();
        } catch (Exception $e) {
            return redirect('/login?error=' . urlencode('Authentication failed. Please try again.'));
        }

        $avatarUrl = $socialUser->getAvatar();

        $dbUser = User::query()
            ->where('google_id', $socialUser->getId())
            ->orWhere('email', $socialUser->getEmail())
            ->first();

        if ($dbUser) {
            $attributes = [];

            if ($dbUser->google_id !== $socialUser->getId()) {
                $attributes['google_id'] = $socialUser->getId();
            }

            if ($dbUser->email_verified_at === null) {
                $attributes['email_verified_at'] = now();
            }

            $name = $socialUser->getName() ?: null;
            if ($name && $dbUser->name !== $name) {
                $attributes['name'] = $name;
            }

            if (filled($avatarUrl) && $dbUser->avatar !== $avatarUrl) {
                $attributes['avatar'] = $avatarUrl;
            }

            if ($attributes !== []) {
                $dbUser->forceFill($attributes)->save();
            }
        } else {
            $dbUser = User::create([
                'name' => $socialUser->getName() ?: 'Google User',
                'email' => $socialUser->getEmail(),
                'google_id' => $socialUser->getId(),
                'avatar' => $avatarUrl,
                'email_verified_at' => now(),
                'password' => Str::random(40),
            ]);

            $dbUser->notify(new WelcomeNotification);
            event(new Registered($dbUser));
        }

        Auth::guard('web')->login($dbUser);
        $request->session()->regenerate();

        $token = $dbUser->createToken('web')->plainTextToken;

        return redirect('/socialite-callback?token=' . urlencode($token) . '&message=' . urlencode('Logged in') . '&provider=' . urlencode($website));
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $request->validate([
            'email' => 'required',
            'password' => 'required',
            'device_name' => 'required',
        ]);

        $user = User::query()->where('email', $request->email)->first();

        if (! $user) {
            throw ValidationException::withMessages(["email" => ["The Provided Email Doesn't Exist."]]);
        }

        if (! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages(['password' => ['The provided password is incorrect.']]);
        }

        if ($user->hasTwoFactorEnabled()) {
            $pendingToken = Str::uuid();

            Cache::put("2fa_pending:{$pendingToken}", $user->id, now()->addMinutes(5));

            return response([
                'message' => 'Two-factor authentication required',
                'two_factor' => true,
                'data' => $pendingToken,
            ], 200);
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        $token = $user
            ->createToken("$request->device_name")
            ->plainTextToken;

        return response([
            "message" => "Logged in",
            "data" => $token,
        ], 200);
    }

    /**
     * Destroy an authenticated session.
     *
     * @return Response
     */
    public function destroy(Request $request)
    {
        $user = auth("sanctum")->user();

        if (! $user) {
            return response(["message" => "No active authenticated user found"], 401);
        }

        CurrentAccessToken::for($user, $request)?->delete();

        if (Auth::guard('web')->check()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response(["message" => "Logged Out"], 200);
    }
}
