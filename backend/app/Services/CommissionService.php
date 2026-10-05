<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\Order;

class CommissionService
{
    private float $defaultRate = 10.00;

    public function createForOrder(Order $order): void
    {
        $items = $order->items()
            ->with('product.shop')
            ->get();

        $sellerTotals = [];

        foreach ($items as $item) {
            $sellerId = $item->product->shop->seller_id;

            $sellerTotals[$sellerId] = (
                $sellerTotals[$sellerId] ?? 0
            ) + (float) $item->subtotal;
        }

        foreach ($sellerTotals as $sellerId => $sellerSubtotal) {
            $amount = $sellerSubtotal * ($this->defaultRate / 100);

            Commission::updateOrCreate(
                [
                    'order_id' => $order->id,
                    'seller_id' => $sellerId,
                ],
                [
                    'rate' => $this->defaultRate,
                    'amount' => $amount,
                ]
            );
        }
    }
}