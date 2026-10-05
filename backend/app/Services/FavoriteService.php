<?php

namespace App\Services;

use App\Models\Favorite;
use App\Models\Product;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class FavoriteService
{
    public function add(
        User $user,
        int $productId
    ): Favorite {
        $product = Product::find($productId);

        if (!$product) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'The selected product does not exist.',
                ],
            ]);
        }

        if ($product->status !== 'published') {
            throw ValidationException::withMessages([
                'product_id' => [
                    'This product is not available.',
                ],
            ]);
        }

        $existingFavorite = Favorite::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($existingFavorite) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'This product is already in your favorites.',
                ],
            ]);
        }

        return Favorite::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);
    }

    public function remove(
        User $user,
        int $productId
    ): void {
        $favorite = Favorite::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->first();

        if (!$favorite) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'This product is not in your favorites.',
                ],
            ]);
        }

        $favorite->delete();
    }
}