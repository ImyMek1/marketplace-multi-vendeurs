<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;

class AdminDashboardService
{
    public function getDashboard(User $admin): array
    {
        $totalUsers = User::count();
        $sellers = User::whereHas('role', function ($query) {
            $query->where('name', 'seller');
        })->count();

        $drivers = User::whereHas('role', function ($query) {
            $query->where('name', 'driver');
        })->count();

        $pendingShops = Shop::where('status', 'pending')->count();
        $pendingProducts = Product::where('status', 'pending')->count();
        $totalOrders = Order::count();
        $totalRevenue = (float) Order::sum('total');

        return [
            'stats' => [
                'total_users' => $totalUsers,
                'sellers' => $sellers,
                'drivers' => $drivers,
                'pending_shops' => $pendingShops,
                'pending_products' => $pendingProducts,
                'total_orders' => $totalOrders,
                'total_revenue' => $totalRevenue,
            ],
            'recent_orders' => Order::query()
                ->with('user:id,name,email')
                ->latest()
                ->limit(5)
                ->get(),
            'pending_products' => Product::query()
                ->with('shop:seller_id,name')
                ->where('status', 'pending')
                ->latest()
                ->limit(5)
                ->get(),
        ];
    }
}
