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
    ) {}

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
        $sellerId = $request->user()->id;

        $orders = Order::query()
            ->whereHas('sellerFulfillments', function ($query) use ($sellerId) {
                $query->where('seller_id', $sellerId);
            })
            ->with([
                'sellerFulfillments' => function ($query) use ($sellerId) {
                    $query->where('seller_id', $sellerId);
                },
                'items' => function ($query) use ($sellerId) {
                    $query->whereHas('product.shop', function ($shopQuery) use ($sellerId) {
                        $shopQuery->where('seller_id', $sellerId);
                    })->with(['product.shop', 'product.images']);
                },
                'payment',
                'delivery',
                'user:id,name,email,phone',
                'commissions' => function ($query) use ($sellerId) {
                    $query->where('seller_id', $sellerId);
                },
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
        $role = $request->user()->role?->name;

        if ($role === 'seller') {
            $order = $this->orderStatusService->updateSellerStatus(
                $order,
                $newStatus,
                $request->user(),
                $request->ip()
            );
        } else {
            $order = $this->orderStatusService->updateStatus(
                $order,
                $newStatus,
                $request->user()->id,
                $request->ip()
            );
        }

        return response()->json([
            'message' => 'Order status updated successfully.',
            'data' => $order->load([
                'sellerFulfillments',
                'commissions',
            ]),
        ]);
    }
}
