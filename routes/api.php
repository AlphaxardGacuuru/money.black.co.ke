<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AiUsageController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CategorySuggestionController;
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

    Route::apiResources([
        'accounts' => AccountController::class,
        'categories' => CategoryController::class,
        'transactions' => TransactionController::class,
        'overview' => OverviewController::class,
    ]);

    Route::get('category-suggestions', [CategorySuggestionController::class, 'index'])->name('api.category-suggestions.index');
    Route::post('category-suggestions/starter', [CategorySuggestionController::class, 'storeStarter'])->name('api.category-suggestions.starter');
    Route::post('category-suggestions/{suggestion}/accept', [CategorySuggestionController::class, 'accept'])->name('api.category-suggestions.accept');
    Route::post('category-suggestions/{suggestion}/dismiss', [CategorySuggestionController::class, 'dismiss'])->name('api.category-suggestions.dismiss');
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

    Route::get('admin/ai-usage', [AiUsageController::class, 'index'])
        ->middleware('can:viewAiUsage')
        ->name('api.admin.ai-usage.index');

    Route::post('onboarding/permissions', [OnboardingController::class, 'completePermissions']);
});
