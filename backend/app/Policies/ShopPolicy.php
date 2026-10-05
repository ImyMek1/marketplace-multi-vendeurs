<?php

namespace App\Policies;

use App\Models\Shop;
use App\Models\User;

class ShopPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role?->name, ['seller', 'admin'], true);
    }

    public function view(User $user, Shop $shop): bool
    {
        return $user->role?->name === 'admin'
            || (
                $user->role?->name === 'seller'
                && $shop->seller_id === $user->id
            );
    }

    public function create(User $user): bool
    {
        return $user->role?->name === 'seller';
    }

    public function update(User $user, Shop $shop): bool
    {
        return $user->role?->name === 'admin'
            || (
                $user->role?->name === 'seller'
                && $shop->seller_id === $user->id
            );
    }

    public function delete(User $user, Shop $shop): bool
    {
        return $user->role?->name === 'admin'
            || (
                $user->role?->name === 'seller'
                && $shop->seller_id === $user->id
            );
    }

    public function approve(User $user, Shop $shop): bool
    {
        return $user->role?->name === 'admin';
    }

    public function suspend(User $user, Shop $shop): bool
    {
        return $user->role?->name === 'admin';
    }

    public function activate(User $user, Shop $shop): bool
    {
        return $user->role?->name === 'admin';
    }
}