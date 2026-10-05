<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public function create(
        User $user,
        string $type,
        string $content
    ): Notification {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'content' => $content,
        ]);
    }

    public function markAsRead(
        User $user,
        Notification $notification
    ): Notification {
        if ($notification->user_id !== $user->id) {
            abort(403, 'Forbidden.');
        }

        $notification->update([
            'read_at' => now(),
        ]);

        return $notification->fresh();
    }

    public function markAllAsRead(User $user): int
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);
    }
}