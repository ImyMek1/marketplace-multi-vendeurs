<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\Order;
use Illuminate\Validation\ValidationException;

class CommissionService
{
    private float $defaultRate = 10.00;

    public function createForSeller(
        Order $order,
        int $sellerId
    ): void {
        $fulfillment = $order->sellerFulfillments()
            ->where('seller_id', $sellerId)
            ->first();

        if (!$fulfillment || !in_array(
            $fulfillment->status,
            ['confirmed', 'prepared'],
            true
        )) {
            throw ValidationException::withMessages([
                'status' => [
                    'Seller fulfillment must be confirmed before commission creation.',
                ],
            ]);
        }

        $items = $order->items()
            ->whereHas('product.shop', function ($query) use ($sellerId) {
                $query->where('seller_id', $sellerId);
            })
            ->get();

        $sellerSubtotal = $items->sum(
            fn ($item) => (float) $item->subtotal
        );

        if ($sellerSubtotal <= 0) {
            return;
        }

        Commission::firstOrCreate(
            [
                'order_id' => $order->id,
                'seller_id' => $sellerId,
            ],
            [
                'rate' => $this->defaultRate,
                'amount' => round(
                    $sellerSubtotal * ($this->defaultRate / 100),
                    2
                ),
            ]
        );
    }

    public function createForOrder(Order $order): void
    {
        $fulfillments = $order->sellerFulfillments()
            ->whereIn('status', ['confirmed', 'prepared'])
            ->get();

        foreach ($fulfillments as $fulfillment) {
            $this->createForSeller(
                $order,
                $fulfillment->seller_id
            );
        }
    }
}
