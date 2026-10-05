<?php

namespace App\Services;

use App\Models\Review;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    public function createReview(
        User $user,
        int $productId,
        int $rating,
        ?string $comment = null
    ): Review {
        $hasPurchased = $user->orders()
            ->where('status', 'delivered')
            ->whereHas('items', function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->exists();

        if (!$hasPurchased) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'You can only review products you have purchased and received.',
                ],
            ]);
        }

        $existingReview = Review::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->exists();

        if ($existingReview) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'You have already reviewed this product.',
                ],
            ]);
        }

        return Review::create([
            'user_id' => $user->id,
            'product_id' => $productId,
            'rating' => $rating,
            'comment' => $comment,
            'status' => 'pending',
        ]);
    }
}