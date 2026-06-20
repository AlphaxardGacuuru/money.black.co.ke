<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class AccountPageController extends Controller
{
    public function edit(string $id): Response
    {
        return Inertia::render('accounts/[id]/edit', ['id' => $id]);
    }
}
