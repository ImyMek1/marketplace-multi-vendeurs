<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private CouponService $couponService,
        private NotificationService $notificationService
    ) {
    }

    public function createOrder(
        User $user,
        int $addressId,
        ?string $couponCode = null
    ): Order {
        return DB::transaction(function () use (
            $user,
            $addressId,
            $couponCode
        ) {
            $address = Address::query()
                ->whereKey($addressId)
                ->where('user_id', $user->id)
                ->first();

            if (!$address) {
                throw ValidationException::withMessages([
                    'address_id' => [
                        'The selected address does not belong to you.',
                    ],
                ]);
            }

            $cart = $user->cart()
                ->with('items')
                ->first();

            if (!$cart || $cart->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => [
                        'Your cart is empty.',
                    ],
                ]);
            }

            $productIds = $cart->items
                ->pluck('product_id')
                ->filter()
                ->unique()
                ->values();

            $products = Product::query()
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotal = 0;

            foreach ($cart->items as $item) {
                $product = $products->get($item->product_id);

                if (!$product || $product->status !== 'published') {
                    throw ValidationException::withMessages([
                        'cart' => [
                            'One or more products are no longer available.',
                        ],
                    ]);
                }

                if ($item->quantity > $product->stock) {
                    throw ValidationException::withMessages([
                        'cart' => [
                            "Insufficient stock for {$product->name}.",
                        ],
                    ]);
                }

                $unitPrice = $product->promotional_price
                    ?? $product->price;

                $subtotal += $unitPrice * $item->quantity;
            }

            $deliveryFee = 30;
            $discount = 0;
            $coupon = null;

            if ($couponCode) {
                $coupon = $this->couponService->findValidCoupon(
                    $couponCode,
                    $subtotal
                );

                $discount = $this->couponService->calculateDiscount(
                    $coupon,
                    $subtotal
                );
            }

            $total = $subtotal + $deliveryFee - $discount;

            $order = Order::create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'order_number' => $this->generateOrderNumber(),
                'recipient_name' => $address->recipient_name,
                'phone' => $address->phone,
                'address_line' => $address->address_line,
                'city' => $address->city,
                'postal_code' => $address->postal_code,
                'additional_info' => $address->additional_info,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'discount' => $discount,
                'total' => $total,
                'status' => 'pending',
                'coupon_id' => $coupon?->id,
            ]);

            foreach ($cart->items as $item) {
                $product = $products->get($item->product_id);

                $unitPrice = $product->promotional_price
                    ?? $product->price;

                $order->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $unitPrice * $item->quantity,
                ]);

                $product->decrement(
                    'stock',
                    $item->quantity
                );
            }

            $order->payment()->create([
                'method' => 'cash_on_delivery',
                'status' => 'pending',
            ]);

            if ($coupon) {
                $this->couponService->incrementUsage($coupon);
            }

            $cart->items()->delete();

            $this->notificationService->create(
                $user,
                'order_created',
                "Your order {$order->order_number} has been created successfully."
            );

            return $order->load([
                'items.product',
                'payment',
                'address',
            ]);
        });
    }

    private function generateOrderNumber(): string
    {
        do {
            $number = 'ORD-' . now()->format('YmdHis')
                . '-' . strtoupper(Str::random(6));
        } while (
            Order::where('order_number', $number)->exists()
        );

        return $number;
    }
}