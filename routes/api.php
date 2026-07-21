<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OneMoneyImportController;
use App\Http\Controllers\OverviewController;
use App\Http\Controllers\TransactionController;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function() {
    Route::get('auth', fn () => UserResource::make(request()->user()))
        ->name('api.auth.show');

    Route::apiResource('accounts', AccountController::class)->names(['index' => 'api.accounts.index']);
    Route::apiResource('categories', CategoryController::class)->names(['index' => 'api.categories.index']);
    Route::apiResource('transactions', TransactionController::class)->names(['index' => 'api.transactions.index']);
    Route::apiResource('overview', OverviewController::class)->names(['index' => 'api.overview.index']);
    Route::post('imports/one-money', [OneMoneyImportController::class, 'store'])
        ->name('imports.one-money.store');
});
