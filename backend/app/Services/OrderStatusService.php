<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    private array $transitions = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['prepared', 'cancelled'],
        'prepared' => ['shipped', 'cancelled'],
        'shipped' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    public function __construct(
        private NotificationService $notificationService,
        private AuditLogService $auditLogService
    ) {
    }

    public function updateStatus(
        Order $order,
        string $newStatus,
        int $userId,
        ?string $ipAddress = null
    ): Order {
        return DB::transaction(function () use (
            $order,
            $newStatus,
            $userId,
            $ipAddress
        ) {
            $order = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $allowedStatuses = $this->transitions[$order->status] ?? [];

            if (!in_array($newStatus, $allowedStatuses, true)) {
                throw ValidationException::withMessages([
                    'status' => [
                        "Cannot change order status from {$order->status} to {$newStatus}.",
                    ],
                ]);
            }

            $oldStatus = $order->status;

            $order->update([
                'status' => $newStatus,
            ]);

            $order->load('user');

            $this->notificationService->create(
                $order->user,
                'order_status_changed',
                "Your order {$order->order_number} status changed from {$oldStatus} to {$newStatus}."
            );

            $user = User::findOrFail($userId);

            $this->auditLogService->create(
                $user,
                'order_status_changed',
                $order,
                "Order {$order->order_number} status changed from {$oldStatus} to {$newStatus}.",
                $ipAddress
            );

            return $order->fresh([
                'items.product.shop',
                'payment',
                'delivery',
                'user',
            ]);
        });
    }
}
