<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array(
            $user->role?->name,
            ['client', 'seller', 'admin'],
            true
        );
    }

    public function view(User $user, Order $order): bool
    {
        if ($user->role?->name === 'admin') {
            return true;
        }

        if ($user->role?->name === 'client') {
            return $order->user_id === $user->id;
        }

        if ($user->role?->name === 'seller') {
            return $order->items()
                ->whereHas('product.shop', function ($query) use ($user) {
                    $query->where('seller_id', $user->id);
                })
                ->exists();
        }

        return false;
    }

    public function updateStatus(
        User $user,
        Order $order
    ): bool {
        if ($user->role?->name === 'admin') {
            return true;
        }

        if ($user->role?->name !== 'seller') {
            return false;
        }

        $hasOwnProducts = $order->items()
            ->whereHas('product.shop', function ($query) use ($user) {
                $query->where('seller_id', $user->id);
            })
            ->exists();

        if (!$hasOwnProducts) {
            return false;
        }

        return in_array($order->status, ['pending', 'confirmed'], true);
    }

    public function cancel(User $user, Order $order): bool
    {
        if ($user->role?->name === 'admin') {
            return true;
        }

        return $user->role?->name === 'client'
            && $order->user_id === $user->id
            && in_array(
                $order->status,
                ['pending', 'confirmed'],
                true
            );
    }
}
