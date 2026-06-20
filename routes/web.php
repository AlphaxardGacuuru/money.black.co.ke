<?php

use App\Http\Controllers\AccountPageController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\CategoryPageController;
use App\Http\Controllers\TransactionPageController;
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
    Route::inertia('dashboard', 'accounts/index')->name('dashboard');
    // Accounts
    Route::inertia('accounts', 'accounts/index')->name('accounts.index');
    Route::inertia('accounts/create', 'accounts/create')->name('accounts.create');
    Route::get('accounts/{id}/edit', [AccountPageController::class, 'edit'])->name('accounts.edit');
    // Categories
    Route::inertia('categories', 'categories/index')->name('categories.index');
    Route::get('categories/create', [CategoryPageController::class, 'create'])->name('categories.create');
    Route::get('categories/{id}/edit', [CategoryPageController::class, 'edit'])->name('categories.edit');
    // Transactions
    Route::get('transactions', [TransactionPageController::class, 'index'])->name('transactions.index');
    // Overview
    Route::inertia('overview', 'overview/index')->name('overview.index');
    // Imports
    Route::inertia('imports/one-money', 'imports/one-money/index')->name('imports.one-money');
});

require __DIR__.'/settings.php';
