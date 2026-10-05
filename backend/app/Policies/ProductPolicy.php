<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role?->name, ['seller', 'admin'], true);
    }

    public function view(User $user, Product $product): bool
    {
        return $user->role?->name === 'admin'
            || (
                $user->role?->name === 'seller'
                && $product->shop?->seller_id === $user->id
            );
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->name, ['seller', 'admin'], true);
    }

    public function update(User $user, Product $product): bool
    {
        return $user->role?->name === 'admin'
            || (
                $user->role?->name === 'seller'
                && $product->shop?->seller_id === $user->id
            );
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->role?->name === 'admin'
            || (
                $user->role?->name === 'seller'
                && $product->shop?->seller_id === $user->id
            );
    }

    public function approve(User $user, Product $product): bool
    {
        return $user->role?->name === 'admin';
    }

    public function publish(User $user, Product $product): bool
    {
        return $user->role?->name === 'admin';
    }

    public function reject(User $user, Product $product): bool
    {
        return $user->role?->name === 'admin';
    }
}