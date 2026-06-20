<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OneMoneyImportController;
use App\Http\Controllers\OverviewController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->group(function () {
    Route::apiResource('accounts', AccountController::class)->names('api.accounts');
    Route::apiResource('categories', CategoryController::class)->names('api.categories');
    Route::apiResource('transactions', TransactionController::class)->names('api.transactions');
    Route::apiResource('overview', OverviewController::class)->names('api.overview');
    Route::post('imports/one-money', [OneMoneyImportController::class, 'store'])
        ->name('imports.one-money.store');
});
