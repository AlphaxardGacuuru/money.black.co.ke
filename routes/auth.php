<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasskeyLoginController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\TwoFactorChallengeController;
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Settings\PasskeyConfirmationController;
use App\Http\Controllers\Settings\PasskeyController;
use App\Http\Middleware\EnsurePasskeyActionConfirmed;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function() {
    Route::get('register', fn () => view('app'))->name('register');

    Route::post('register', [RegisteredUserController::class, 'store'])
        ->name('register.store');

    Route::get('login', fn () => view('app'))->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store'])
        ->name('login.store');

    Route::get('passkeys/login/options', [PasskeyLoginController::class, 'options'])
        ->middleware('throttle:10,1,passkey-login')
        ->name('passkey.login-options');

    Route::post('passkeys/login', [PasskeyLoginController::class, 'store'])
        ->middleware('throttle:10,1,passkey-login')
        ->name('passkey.login');

    Route::get('forgot-password', fn () => view('app'))
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', fn () => view('app'))
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.update');
});

Route::get('two-factor-challenge', fn () => view('app'))
    ->name('two-factor.login');

Route::post('two-factor-challenge', [TwoFactorChallengeController::class, 'store'])
    ->name('two-factor-challenge.store');

Route::get('verify-email/{id}/{hash}', [EmailVerificationPromptController::class, '__invoke'])
    ->name('verification.notice');

Route::middleware('auth:sanctum')->group(function() {
    Route::post('verify-email/{id}/{hash}', [VerifyEmailController::class, '__invoke'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', fn () => view('app'))
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    Route::post('two-factor/enable', [TwoFactorController::class, 'enable'])
        ->name('two-factor.enable');

    Route::post('two-factor/confirm', [TwoFactorController::class, 'confirm'])
        ->name('two-factor.confirm');

    Route::post('two-factor/disable', [TwoFactorController::class, 'disable'])
        ->name('two-factor.disable');

    Route::get('two-factor/qr-code', [TwoFactorController::class, 'qrCode'])
        ->name('two-factor.qr-code');

    Route::get('two-factor/secret-key', [TwoFactorController::class, 'secretKey'])
        ->name('two-factor.secret-key');

    Route::get('two-factor/recovery-codes', [TwoFactorController::class, 'recoveryCodes'])
        ->name('two-factor.recovery-codes');

    Route::post('two-factor/recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes'])
        ->name('two-factor.recovery-codes.regenerate');

    Route::get('user/passkeys', [PasskeyController::class, 'index'])
        ->name('passkey.index');

    Route::get('user/passkeys/confirmation', [PasskeyConfirmationController::class, 'show'])
        ->name('passkey.confirmation.show');

    Route::get('user/passkeys/confirmation/options', [PasskeyConfirmationController::class, 'options'])
        ->middleware('throttle:10,1,passkey-confirm')
        ->name('passkey.confirmation.options');

    Route::post('user/passkeys/confirmation', [PasskeyConfirmationController::class, 'store'])
        ->middleware('throttle:10,1,passkey-confirm')
        ->name('passkey.confirmation.store');

    Route::post('user/passkeys/confirmation/email', [PasskeyConfirmationController::class, 'sendEmailCode'])
        ->middleware('throttle:3,1,passkey-email')
        ->name('passkey.confirmation.email');

    Route::post('user/passkeys/confirmation/email/verify', [PasskeyConfirmationController::class, 'verifyEmailCode'])
        ->middleware('throttle:6,1,passkey-email-verify')
        ->name('passkey.confirmation.email.verify');

    Route::middleware(EnsurePasskeyActionConfirmed::class)->group(function() {
        Route::get('user/passkeys/options', [PasskeyController::class, 'options'])
            ->name('passkey.registration-options');

        Route::post('user/passkeys', [PasskeyController::class, 'store'])
            ->middleware('throttle:6,1,passkey-store')
            ->name('passkey.store');

        Route::delete('user/passkeys/{passkey}', [PasskeyController::class, 'destroy'])
            ->name('passkey.destroy');
    });
});

/*
 * Social logins */
Route::get('login/{website}/redirect', [AuthenticatedSessionController::class, 'redirectToProvider'])
    ->middleware('guest')
    ->name('login.google.redirect');

Route::get('login/{website}/callback', [AuthenticatedSessionController::class, 'handleProviderCallback'])
    ->name('login.google.callback');
