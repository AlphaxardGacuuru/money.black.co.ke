<?php

namespace App\Policies;

use App\Models\CategorySuggestion;
use App\Models\User;

class CategorySuggestionPolicy
{
    public function update(User $user, CategorySuggestion $suggestion): bool
    {
        return $suggestion->user_id === $user->id;
    }
}
