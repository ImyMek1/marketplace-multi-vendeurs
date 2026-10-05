<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeliveryService
{
    private array $transitions = [
        'assigned' => ['picked_up', 'failed'],
        'picked_up' => ['in_transit', 'failed'],
        'in_transit' => ['delivered', 'failed'],
        'delivered' => [],
        'failed' => [],
    ];

    public function __construct(
        private NotificationService $notificationService
    ) {
    }

    public function assignDriver(
        Order $order,
        User $driver,
        User $admin
    ): Delivery {
        if ($driver->role?->name !== 'driver') {
            throw ValidationException::withMessages([
                'driver_id' => [
                    'The selected user is not a driver.',
                ],
            ]);
        }

        if ($driver->status !== 'active') {
            throw ValidationException::withMessages([
                'driver_id' => [
                    'The selected driver is not active.',
                ],
            ]);
        }

        if ($order->status !== 'prepared') {
            throw ValidationException::withMessages([
                'order' => [
                    'This order cannot be assigned for delivery.',
                ],
            ]);
        }

        return DB::transaction(function () use (
            $order,
            $driver,
            $admin
        ) {
            $order = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($order->status !== 'prepared') {
                throw ValidationException::withMessages([
                    'order' => [
                        'This order cannot be assigned for delivery.',
                    ],
                ]);
            }

            $delivery = Delivery::query()
                ->where('order_id', $order->id)
                ->lockForUpdate()
                ->first();

            if ($delivery) {
                if ($delivery->status !== 'assigned') {
                    throw ValidationException::withMessages([
                        'order' => [
                            'This delivery can no longer be reassigned.',
                        ],
                    ]);
                }

                $delivery->update([
                    'driver_id' => $driver->id,
                    'assigned_at' => now(),
                ]);
            } else {
                $delivery = Delivery::create([
                    'order_id' => $order->id,
                    'driver_id' => $driver->id,
                    'status' => 'assigned',
                    'assigned_at' => now(),
                ]);
            }

            $delivery->statusHistories()->create([
                'status' => 'assigned',
                'changed_by' => $admin->id,
                'note' => 'Delivery assigned to driver.',
            ]);

            $this->notificationService->create(
                $driver,
                'delivery_assigned',
                "Delivery for order {$order->order_number} has been assigned to you."
            );

            return $delivery->load([
                'order',
                'driver',
                'statusHistories',
            ]);
        });
    }

    public function updateStatus(
        Delivery $delivery,
        string $newStatus,
        User $user,
        ?string $note = null
    ): Delivery {
        return DB::transaction(function () use (
            $delivery,
            $newStatus,
            $user,
            $note
        ) {
            $delivery = Delivery::query()
                ->whereKey($delivery->id)
                ->lockForUpdate()
                ->firstOrFail();

            $allowedStatuses = $this->transitions[
                $delivery->status
            ] ?? [];

            if (!in_array($newStatus, $allowedStatuses, true)) {
                throw ValidationException::withMessages([
                    'status' => [
                        "Cannot change delivery status from {$delivery->status} to {$newStatus}.",
                    ],
                ]);
            }

            $now = now();

            $data = [
                'status' => $newStatus,
            ];

            match ($newStatus) {
                'picked_up' => $data['picked_up_at'] = $now,
                'in_transit' => $data['in_transit_at'] = $now,
                'delivered' => $data['delivered_at'] = $now,
                'failed' => $data['failed_at'] = $now,
                default => null,
            };

            if ($newStatus === 'failed') {
                $data['failure_reason'] = $note;
            }

            $delivery->update($data);

            $delivery->statusHistories()->create([
                'status' => $newStatus,
                'changed_by' => $user->id,
                'note' => $note,
                'created_at' => $now,
            ]);

            $order = $delivery->order()
                ->lockForUpdate()
                ->firstOrFail();

            if ($newStatus === 'in_transit') {
                $order->update([
                    'status' => 'shipped',
                ]);
            }

            if ($newStatus === 'delivered') {
                $order->update([
                    'status' => 'delivered',
                ]);
            }

            $order->load('user');

            $this->notificationService->create(
                $order->user,
                'delivery_status_changed',
                "Your delivery for order {$order->order_number} status changed to {$newStatus}."
            );

            return $delivery->fresh([
                'order',
                'driver',
                'statusHistories',
            ]);
        });
    }
}
