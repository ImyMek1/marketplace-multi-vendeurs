<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignDriverRequest;
use App\Http\Requests\UpdateDeliveryStatusRequest;
use App\Models\Delivery;
use App\Models\Order;
use App\Services\AuditLogService;
use App\Services\DeliveryService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function __construct(
        private DeliveryService $deliveryService,
        private AuditLogService $auditLogService
    ) {
    }

    public function driverDeliveries(Request $request): JsonResponse
    {
        $deliveries = Delivery::query()
            ->where('driver_id', $request->user()->id)
            ->with([
                'order:id,order_number,user_id,total,status',
                'order.user:id,name,phone',
                'statusHistories.changedBy:id,name',
            ])
            ->latest()
            ->paginate(10);

        return response()->json($deliveries);
    }

    public function show(
        Request $request,
        Delivery $delivery
    ): JsonResponse {
        $this->authorize('view', $delivery);

        $delivery->load([
            'order.items.product.shop',
            'order.user:id,name,email,phone',
            'driver:id,name,email,phone',
            'statusHistories.changedBy:id,name',
        ]);

        return response()->json([
            'data' => $delivery,
        ]);
    }

    public function assign(
        AssignDriverRequest $request,
        Order $order
    ): JsonResponse {
        $this->authorize('assign', Delivery::class);

        $driver = User::findOrFail(
            $request->integer('driver_id')
        );

        $delivery = $this->deliveryService->assignDriver(
            $order,
            $driver,
            $request->user()
        );

        $this->auditLogService->create(
            $request->user(),
            'delivery_assigned',
            $delivery,
            "Delivery for order {$order->order_number} was assigned to driver {$driver->name}.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Driver assigned successfully.',
            'data' => $delivery,
        ]);
    }

    public function updateStatus(
        UpdateDeliveryStatusRequest $request,
        Delivery $delivery
    ): JsonResponse {
        $this->authorize('updateStatus', $delivery);

        $oldStatus = $delivery->status;
        $newStatus = $request->validated('status');

        $delivery = $this->deliveryService->updateStatus(
            $delivery,
            $newStatus,
            $request->user(),
            $request->validated('note')
        );

        $this->auditLogService->create(
            $request->user(),
            'delivery_status_changed',
            $delivery,
            "Delivery for order {$delivery->order->order_number} status changed from {$oldStatus} to {$newStatus}.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Delivery status updated successfully.',
            'data' => $delivery,
        ]);
    }

    public function history(
        Request $request,
        Delivery $delivery
    ): JsonResponse {
        $this->authorize('view', $delivery);

        $history = $delivery->statusHistories()
            ->with('changedBy:id,name')
            ->latest('created_at')
            ->paginate(20);

        return response()->json($history);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Delivery::class);

        $deliveries = Delivery::query()
            ->with([
                'order:id,order_number,total,status',
                'driver:id,name,email,phone',
            ])
            ->latest()
            ->paginate(10);

        return response()->json($deliveries);
    }
}
