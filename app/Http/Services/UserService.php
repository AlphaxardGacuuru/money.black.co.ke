<?php

namespace App\Http\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UserService extends Service
{
    /**
     * Store a new profile picture for $user, deleting the one they uploaded
     * before (Google and default avatars aren't ours to delete).
     */
    public function updateAvatar(User $user, UploadedFile $avatar): void
    {
        $previous = $user->hasUploadedAvatar()
            ? $user->getRawOriginal('avatar')
            : null;

        $user
            ->forceFill(['avatar' => $avatar->store(User::AVATAR_UPLOAD_DIRECTORY, 'public')])
            ->save();

        if ($previous) {
            Storage::disk('public')->delete($previous);
        }
    }
}
