<?php

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => view('app'))->name('home');

/*
 * Web Share Target fallback. The service worker normally intercepts this POST and
 * uploads the shared file itself; this only runs when no service worker is active,
 * so nothing is stored and the user is sent to the Receipts page to upload manually.
 */
Route::post('receipts/share', fn () => redirect('/receipts?share=unavailable', 303))
    ->withoutMiddleware(ValidateCsrfToken::class)
    ->name('receipts.share');

require __DIR__ . '/auth.php';

require __DIR__ . '/settings.php';

Route::fallback(fn () => view('app'));
