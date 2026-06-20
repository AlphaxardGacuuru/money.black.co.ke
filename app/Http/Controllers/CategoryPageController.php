<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class CategoryPageController extends Controller
{
    public function edit(string $id): Response
    {
        return Inertia::render('categories/[id]/edit', ['id' => $id]);
    }
}
