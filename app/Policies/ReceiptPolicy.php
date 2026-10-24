<?php

namespace App\Policies;

use App\Models\Receipt;
use App\Models\User;

class ReceiptPolicy
{
    public function view(User $user, Receipt $receipt): bool
    {
        return $receipt->user_id === $user->id;
    }

    public function update(User $user, Receipt $receipt): bool
    {
        return $receipt->user_id === $user->id;
    }

    public function delete(User $user, Receipt $receipt): bool
    {
        return $receipt->user_id === $user->id;
    }
}
