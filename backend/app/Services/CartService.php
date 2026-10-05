<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function getOrCreateCart(int $userId): Cart
    {
        return Cart::firstOrCreate([
            'user_id' => $userId,
        ]);
    }

    public function addItem(
        int $userId,
        int $productId,
        int $quantity
    ): Cart {
        $cart = $this->getOrCreateCart($userId);

        $product = Product::findOrFail($productId);

        if ($product->status !== 'published') {
            throw ValidationException::withMessages([
                'product_id' => [
                    'This product is not available.',
                ],
            ]);
        }

        if ($product->stock <= 0) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'This product is out of stock.',
                ],
            ]);
        }

        $item = $cart->items()
            ->where('product_id', $productId)
            ->first();

        $newQuantity = ($item?->quantity ?? 0) + $quantity;

        if ($newQuantity > $product->stock) {
            throw ValidationException::withMessages([
                'quantity' => [
                    'Requested quantity exceeds available stock.',
                ],
            ]);
        }

        if ($item) {
            $item->update([
                'quantity' => $newQuantity,
            ]);
        } else {
            $cart->items()->create([
                'product_id' => $productId,
                'quantity' => $quantity,
            ]);
        }

        return $cart->fresh([
            'items.product.shop',
            'items.product.category',
            'items.product.images',
        ]);
    }

    public function updateItem(
        int $userId,
        int $itemId,
        int $quantity
    ): Cart {
        $cart = $this->getOrCreateCart($userId);

        $item = $cart->items()
            ->with('product')
            ->findOrFail($itemId);

        if ($item->product->status !== 'published') {
            throw ValidationException::withMessages([
                'product_id' => [
                    'This product is no longer available.',
                ],
            ]);
        }

        if ($quantity > $item->product->stock) {
            throw ValidationException::withMessages([
                'quantity' => [
                    'Requested quantity exceeds available stock.',
                ],
            ]);
        }

        $item->update([
            'quantity' => $quantity,
        ]);

        return $cart->fresh([
            'items.product.shop',
            'items.product.category',
            'items.product.images',
        ]);
    }

    public function removeItem(
        int $userId,
        int $itemId
    ): Cart {
        $cart = $this->getOrCreateCart($userId);

        $cart->items()
            ->findOrFail($itemId)
            ->delete();

        return $cart->fresh([
            'items.product.shop',
            'items.product.category',
            'items.product.images',
        ]);
    }
}