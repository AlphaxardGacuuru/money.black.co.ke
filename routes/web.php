<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OverviewController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware('guest')->group(function () {
    Route::get('login/google/redirect', [SocialiteController::class, 'redirect'])
        ->name('login.google.redirect');
    Route::get('login/google/callback', [SocialiteController::class, 'callback'])
        ->name('login.google.callback');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [AccountController::class, 'index'])->name('dashboard');
    Route::get('overview', [OverviewController::class, 'index'])->name('overview');

    Route::resource('accounts', AccountController::class);
    Route::resource('categories', CategoryController::class);
    Route::resource('transactions', TransactionController::class)->only(['index', 'store', 'update']);
});

require __DIR__ . '/settings.php';
