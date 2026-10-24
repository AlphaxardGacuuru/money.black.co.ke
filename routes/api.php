<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\OneMoneyImportController;
use App\Http\Controllers\OverviewController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\ReceiptController;
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

    Route::get('receipts', [ReceiptController::class, 'index'])->name('api.receipts.index');
    Route::post('receipts', [ReceiptController::class, 'store'])
        ->middleware('throttle:20,1,receipts-upload')
        ->name('api.receipts.store');
    Route::get('receipts/{receipt}', [ReceiptController::class, 'show'])->name('api.receipts.show');
    Route::get('receipts/{receipt}/file', [ReceiptController::class, 'file'])->name('api.receipts.file');
    Route::post('receipts/{receipt}/confirm', [ReceiptController::class, 'confirm'])->name('api.receipts.confirm');
    Route::post('receipts/{receipt}/retry', [ReceiptController::class, 'retry'])
        ->middleware('throttle:10,1,receipts-retry')
        ->name('api.receipts.retry');
    Route::delete('receipts/{receipt}', [ReceiptController::class, 'destroy'])->name('api.receipts.destroy');

    Route::post('push-subscriptions', [PushSubscriptionController::class, 'store']);
    Route::delete('push-subscriptions', [PushSubscriptionController::class, 'destroy']);

    Route::post('onboarding/permissions', [OnboardingController::class, 'completePermissions']);
});
