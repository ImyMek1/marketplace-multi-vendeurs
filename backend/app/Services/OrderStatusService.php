<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    public function __construct(
        private NotificationService $notificationService,
        private AuditLogService $auditLogService,
        private CommissionService $commissionService
    ) {}

    public function updateSellerStatus(
        Order $order,
        string $newStatus,
        User $seller,
        ?string $ipAddress = null
    ): Order {
        return DB::transaction(function () use (
            $order,
            $newStatus,
            $seller,
            $ipAddress
        ) {
            $order = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!in_array($order->status, ['pending', 'confirmed'], true)) {
                throw ValidationException::withMessages([
                    'status' => [
                        'This order can no longer be updated by a seller.',
                    ],
                ]);
            }

            $fulfillment = $order->sellerFulfillments()
                ->where('seller_id', $seller->id)
                ->lockForUpdate()
                ->first();

            if (!$fulfillment) {
                throw ValidationException::withMessages([
                    'status' => [
                        'No fulfillment belongs to this seller.',
                    ],
                ]);
            }

            $allowed = match ($fulfillment->status) {
                'pending' => ['confirmed'],
                'confirmed' => ['prepared'],
                default => [],
            };

            if (!in_array($newStatus, $allowed, true)) {
                throw ValidationException::withMessages([
                    'status' => [
                        "Cannot change seller fulfillment from {$fulfillment->status} to {$newStatus}.",
                    ],
                ]);
            }

            $oldFulfillmentStatus = $fulfillment->status;
            $oldOrderStatus = $order->status;

            $data = ['status' => $newStatus];

            if ($newStatus === 'confirmed') {
                $data['confirmed_at'] = now();
            }

            if ($newStatus === 'prepared') {
                $data['prepared_at'] = now();
            }

            $fulfillment->update($data);

            if ($newStatus === 'confirmed') {
                $this->commissionService->createForSeller(
                    $order,
                    $seller->id
                );
            }

            $statuses = $order->sellerFulfillments()
                ->pluck('status');

            if ($statuses->every(
                fn ($status) => $status === 'prepared'
            )) {
                $globalStatus = 'prepared';
            } elseif ($statuses->contains('pending')) {
                $globalStatus = 'pending';
            } else {
                $globalStatus = 'confirmed';
            }

            if ($globalStatus !== $oldOrderStatus) {
                $order->update([
                    'status' => $globalStatus,
                ]);

                $order->load('user');

                $this->notificationService->create(
                    $order->user,
                    'order_status_changed',
                    "Your order {$order->order_number} status changed from {$oldOrderStatus} to {$globalStatus}."
                );
            }

            $this->auditLogService->create(
                $seller,
                'seller_fulfillment_status_changed',
                $order,
                "Seller {$seller->id} changed fulfillment from {$oldFulfillmentStatus} to {$newStatus} for order {$order->order_number}.",
                $ipAddress
            );

            return $order->fresh([
                'items.product.shop',
                'payment',
                'delivery',
                'user',
                'sellerFulfillments',
                'commissions',
            ]);
        });
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

            // Admin can cancel the entire order,
            // but cannot bypass sellers or delivery workflow.
            if (
                $newStatus !== 'cancelled'
                || !in_array(
                    $order->status,
                    ['pending', 'confirmed', 'prepared'],
                    true
                )
            ) {
                throw ValidationException::withMessages([
                    'status' => [
                        'Admin can only cancel orders before shipping. Seller preparation and delivery statuses are managed by their respective workflows.',
                    ],
                ]);
            }

            $oldStatus = $order->status;

            // Lock and cancel ALL seller fulfillments.
            $order->sellerFulfillments()
                ->lockForUpdate()
                ->get();

            $order->sellerFulfillments()
                ->whereIn('status', [
                    'pending',
                    'confirmed',
                    'prepared',
                ])
                ->update([
                    'status' => 'cancelled',
                ]);

            $order->update([
                'status' => 'cancelled',
            ]);

            $order->load('user');

            $this->notificationService->create(
                $order->user,
                'order_status_changed',
                "Your order {$order->order_number} status changed from {$oldStatus} to cancelled."
            );

            $user = User::findOrFail($userId);

            $this->auditLogService->create(
                $user,
                'order_status_changed',
                $order,
                "Order {$order->order_number} status changed from {$oldStatus} to cancelled.",
                $ipAddress
            );

            return $order->fresh([
                'items.product.shop',
                'payment',
                'delivery',
                'user',
                'sellerFulfillments',
                'commissions',
            ]);
        });
    }
}
