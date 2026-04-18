<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Auth\SocialiteController;
use Illuminate\Http\Request;
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
    // Accounts
    Route::inertia('accounts', 'accounts/index')->name('accounts.index');
    Route::inertia('accounts/create', 'accounts/create')->name('accounts.create');
    Route::inertia('accounts/{id}/edit', 'accounts/[id]/edit', [
        'id' => fn(Request $request): string => (string) $request->route('id'),
    ])->name('accounts.edit');
    // Categories
    Route::inertia('categories', 'categories/index')->name('categories.index');
    Route::inertia('categories/create', 'categories/create')->name('categories.create');
    Route::inertia('categories/{id}/edit', 'categories/[id]/edit', [
        'id' => fn (Request $request): string => (string) $request->route('id'),
    ])->name('categories.edit');
    // Transactions
    Route::inertia('transactions', 'transactions/index')->name('transactions.index');
    // Overview
    Route::inertia('overview', 'overview/index')->name('overview.index');
});

require __DIR__.'/settings.php';
