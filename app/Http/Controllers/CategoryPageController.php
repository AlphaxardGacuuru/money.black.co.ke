<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryPageController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('categories/create', [
            'defaultType' => $request->query('type'),
        ]);
    }

    public function edit(string $id): Response
    {
        return Inertia::render('categories/[id]/edit', ['id' => $id]);
    }
}
