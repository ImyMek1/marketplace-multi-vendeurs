<?php

namespace App\Policies;

use App\Models\Delivery;
use App\Models\User;

class DeliveryPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array(
            $user->role?->name,
            ['driver', 'admin'],
            true
        );
    }

    public function view(User $user, Delivery $delivery): bool
    {
        if ($user->role?->name === 'admin') {
            return true;
        }

        return $user->role?->name === 'driver'
            && $delivery->driver_id === $user->id;
    }

    public function updateStatus(
        User $user,
        Delivery $delivery
    ): bool {
        if ($user->role?->name === 'admin') {
            return true;
        }

        return $user->role?->name === 'driver'
            && $delivery->driver_id === $user->id;
    }

    public function assign(
        User $user
    ): bool {
        return $user->role?->name === 'admin';
    }
}