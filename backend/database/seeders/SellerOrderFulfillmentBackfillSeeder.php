<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SellerOrderFulfillmentBackfillSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $expectedStatuses = [
                1 => 'delivered',
                2 => 'delivered',
                3 => 'prepared',
                4 => 'confirmed',
                5 => 'delivered',
            ];

            foreach ($expectedStatuses as $orderId => $expectedStatus) {
                $order = DB::table('orders')
                    ->where('id', $orderId)
                    ->lockForUpdate()
                    ->first();

                if (!$order || $order->status !== $expectedStatus) {
                    throw new RuntimeException(
                        "Order {$orderId} missing or status changed."
                    );
                }

                $items = DB::table('order_items')
                    ->where('order_id', $orderId)
                    ->get();

                if ($items->count() !== 1 || (int) $items[0]->product_id !== 1) {
                    throw new RuntimeException(
                        "Unexpected items in order {$orderId}."
                    );
                }

                $fulfillmentStatus = match ($order->status) {
                    'confirmed' => 'confirmed',
                    'prepared', 'delivered' => 'prepared',
                };

                DB::table('seller_order_fulfillments')
                    ->insertOrIgnore([
                        'order_id' => $orderId,
                        'seller_id' => 3,
                        'status' => $fulfillmentStatus,
                        'confirmed_at' => null,
                        'prepared_at' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
            }
        });
    }
}
