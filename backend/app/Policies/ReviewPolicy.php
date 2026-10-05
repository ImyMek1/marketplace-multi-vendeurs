<?php

namespace App\Policies;

use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role?->name, ['client', 'admin'], true);
    }

    public function view(User $user, Review $review): bool
    {
        return $user->role?->name === 'admin'
            || (
                $user->role?->name === 'client'
                && $review->user_id === $user->id
            );
    }

    public function create(User $user): bool
    {
        return $user->role?->name === 'client';
    }

    public function update(User $user, Review $review): bool
    {
        return $user->role?->name === 'admin'
            || (
                $user->role?->name === 'client'
                && $review->user_id === $user->id
            );
    }

    public function delete(User $user, Review $review): bool
    {
        return $user->role?->name === 'admin'
            || (
                $user->role?->name === 'client'
                && $review->user_id === $user->id
            );
    }

    public function moderate(User $user, Review $review): bool
    {
        return $user->role?->name === 'admin';
    }
}