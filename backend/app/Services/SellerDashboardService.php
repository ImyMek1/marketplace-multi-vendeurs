<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SellerDashboardService
{
    public function getDashboard(User $seller): array
    {
        $shop = Shop::where('seller_id', $seller->id)->first();

        if (!$shop) {
            return [
                'shop' => null,
                'stats' => [
                    'revenue' => 0,
                    'orders' => 0,
                    'active_products' => 0,
                    'low_stock_products' => 0,
                    'commissions' => 0,
                ],
                'recent_orders' => [],
                'best_sellers' => [],
            ];
        }

        $shopId = $shop->id;

        $sellerProductIds = Product::query()
            ->where('shop_id', $shopId)
            ->pluck('id');

        $sellerOrderIds = DB::table('order_items')
            ->whereIn('product_id', $sellerProductIds)
            ->distinct()
            ->pluck('order_id');

        $revenue = (float) DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('order_items.product_id', $sellerProductIds)
            ->whereIn('orders.status', [
                'confirmed',
                'prepared',
                'shipped',
                'delivered',
            ])
            ->sum(
                DB::raw(
                    'order_items.quantity * order_items.unit_price'
                )
            );

        $ordersCount = $sellerOrderIds->count();

        $activeProducts = Product::query()
            ->where('shop_id', $shopId)
            ->where('status', 'published')
            ->count();

        $lowStockProducts = Product::query()
            ->where('shop_id', $shopId)
            ->where('status', 'published')
            ->whereColumn('stock', '<=', 'alert_threshold')
            ->count();

        $commissions = (float) Commission::query()
            ->where('seller_id', $seller->id)
            ->sum('amount');

        $recentOrders = Order::query()
            ->whereIn('id', $sellerOrderIds)
            ->with([
                'user:id,name,email',
                'items' => function ($query) use ($shopId) {
                    $query
                        ->whereHas('product', function ($productQuery) use ($shopId) {
                            $productQuery->where('shop_id', $shopId);
                        })
                        ->with('product');
                },
            ])
            ->latest()
            ->limit(5)
            ->get();

        $bestSellers = DB::table('order_items')
            ->join(
                'products',
                'order_items.product_id',
                '=',
                'products.id'
            )
            ->where('products.shop_id', $shopId)
            ->select(
                'products.id',
                'products.name',
                DB::raw(
                    'SUM(order_items.quantity) as total_quantity'
                ),
                DB::raw(
                    'SUM(order_items.quantity * order_items.unit_price) as total_revenue'
                )
            )
            ->groupBy(
                'products.id',
                'products.name'
            )
            ->orderByDesc('total_quantity')
            ->limit(5)
            ->get();

        return [
            'shop' => $shop,
            'stats' => [
                'revenue' => $revenue,
                'orders' => $ordersCount,
                'active_products' => $activeProducts,
                'low_stock_products' => $lowStockProducts,
                'commissions' => $commissions,
            ],
            'recent_orders' => $recentOrders,
            'best_sellers' => $bestSellers,
        ];
    }
}