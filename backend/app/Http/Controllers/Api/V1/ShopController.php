<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreShopRequest;
use App\Http\Requests\UpdateShopRequest;
use App\Models\Shop;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ShopController extends Controller
{
    public function __construct(
        private AuditLogService $auditLogService
    ) {
    }

    public function show(Shop $shop): JsonResponse
    {
        if ($shop->status !== 'active') {
            abort(404);
        }

        $shop->load([
            'seller:id,name',
            'products' => function ($query) {
                $query->where('status', 'published')
                    ->with([
                        'category:id,name',
                        'images:id,product_id,path,is_primary,sort_order',
                    ]);
            },
        ]);

        return response()->json([
            'data' => $shop,
        ]);
    }

    public function store(StoreShopRequest $request): JsonResponse
    {
        Gate::forUser($request->user())->authorize(
            'create',
            Shop::class
        );

        $user = $request->user();

        if ($user->shop()->exists()) {
            return response()->json([
                'message' => 'You already have a shop.',
            ], 409);
        }

        $shop = Shop::create([
            'seller_id' => $user->id,
            'name' => $request->validated()['name'],
            'description' => $request->validated()['description'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Shop created successfully and is pending approval.',
            'data' => $shop,
        ], 201);
    }

    public function update(
        UpdateShopRequest $request,
        Shop $shop
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'update',
            $shop
        );

        $shop->update($request->validated());

        return response()->json([
            'message' => 'Shop updated successfully.',
            'data' => $shop->fresh(),
        ]);
    }

    public function myShop(Request $request): JsonResponse
    {
        $shop = $request->user()
            ->shop()
            ->withCount('products')
            ->first();

        if (!$shop) {
            return response()->json([
                'message' => 'You do not have a shop yet.',
            ], 404);
        }

        return response()->json([
            'data' => $shop,
        ]);
    }

    public function approve(
        Request $request,
        Shop $shop
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'approve',
            $shop
        );

        if ($shop->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending shops can be approved.',
            ], 422);
        }

        $shop->update([
            'status' => 'active',
        ]);

        $this->auditLogService->create(
            $request->user(),
            'shop_approved',
            $shop,
            "Shop {$shop->name} was approved.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Shop approved successfully.',
            'data' => $shop->fresh(),
        ]);
    }

    public function suspend(
        Request $request,
        Shop $shop
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'suspend',
            $shop
        );

        if ($shop->status !== 'active') {
            return response()->json([
                'message' => 'Only active shops can be suspended.',
            ], 422);
        }

        $shop->update([
            'status' => 'suspended',
        ]);

        $this->auditLogService->create(
            $request->user(),
            'shop_suspended',
            $shop,
            "Shop {$shop->name} was suspended.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Shop suspended successfully.',
            'data' => $shop->fresh(),
        ]);
    }

    public function activate(
        Request $request,
        Shop $shop
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'activate',
            $shop
        );

        if ($shop->status !== 'suspended') {
            return response()->json([
                'message' => 'Only suspended shops can be activated.',
            ], 422);
        }

        $shop->update([
            'status' => 'active',
        ]);

        $this->auditLogService->create(
            $request->user(),
            'shop_activated',
            $shop,
            "Shop {$shop->name} was activated.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Shop activated successfully.',
            'data' => $shop->fresh(),
        ]);
    }
}