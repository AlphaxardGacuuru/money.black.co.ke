<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use Illuminate\Http\RedirectResponse;

class SecurityController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->password,
        ]);

        $request->session()->flash('flash.toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back();
    }
}
