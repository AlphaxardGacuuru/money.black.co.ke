<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     *
     * @return mixed
     */
    public function __invoke(Request $request)
    {
        return redirect(config("app.url") . "/#/verify-email/{$request->id}/{$request->hash}?expires={$request->expires}&signature={$request->signature}");
    }
}
