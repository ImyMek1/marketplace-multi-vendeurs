<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Services\CommissionService;
use App\Services\OrderService;
use App\Services\OrderStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService,
        private OrderStatusService $orderStatusService,
        private CommissionService $commissionService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with([
                'items.product',
                'payment',
                'delivery',
                'commissions',
            ])
            ->latest()
            ->paginate(10);

        return response()->json($orders);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->createOrder(
            $request->user(),
            $request->integer('address_id'),
            $request->validated('coupon_code')
        );

        return response()->json([
            'message' => 'Order created successfully.',
            'data' => $order,
        ], 201);
    }

    public function show(
        Request $request,
        Order $order
    ): JsonResponse {
        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Forbidden.',
            ], 403);
        }

        $order->load([
            'items.product.shop',
            'items.product.images',
            'payment',
            'delivery',
            'commissions',
        ]);

        return response()->json([
            'data' => $order,
        ]);
    }

    public function sellerOrders(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->whereHas('items.product.shop', function ($query) use ($request) {
                $query->where('seller_id', $request->user()->id);
            })
            ->with([
                'items' => function ($query) use ($request) {
                    $query
                        ->whereHas('product.shop', function ($shopQuery) use ($request) {
                            $shopQuery->where(
                                'seller_id',
                                $request->user()->id
                            );
                        })
                        ->with([
                            'product.shop',
                            'product.images',
                        ]);
                },
                'payment',
                'delivery',
                'user:id,name,email,phone',
                'commissions',
            ])
            ->latest()
            ->paginate(10);

        return response()->json($orders);
    }

    public function updateStatus(
        UpdateOrderStatusRequest $request,
        Order $order
    ): JsonResponse {
        Gate::forUser($request->user())
            ->authorize('updateStatus', $order);

        $newStatus = $request->validated('status');

        $order = $this->orderStatusService->updateStatus(
            $order,
            $newStatus,
            $request->user()->id,
            $request->ip()
        );

        if ($newStatus === 'confirmed') {
            $this->commissionService->createForOrder($order);
        }

        return response()->json([
            'message' => 'Order status updated successfully.',
            'data' => $order->load('commissions'),
        ]);
    }
}