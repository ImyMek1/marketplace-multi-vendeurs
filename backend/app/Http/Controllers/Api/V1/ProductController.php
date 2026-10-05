<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Models\Shop;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProductController extends Controller
{
    public function __construct(
        private AuditLogService $auditLogService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'category_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
            ],

            'shop_id' => [
                'nullable',
                'integer',
                'exists:shops,id',
            ],

            'min_price' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'max_price' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'sort' => [
                'nullable',
                'string',
                'in:price_asc,price_desc,newest,popular,rating',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:50',
            ],
        ]);

        if (
            isset($validated['min_price'], $validated['max_price'])
            && $validated['min_price'] > $validated['max_price']
        ) {
            return response()->json([
                'message' => 'The minimum price cannot exceed the maximum price.',
            ], 422);
        }

        $query = Product::query()
            ->with([
                'shop:id,seller_id,name',
                'category:id,name,parent_id',
                'images:id,product_id,path,is_primary,sort_order',
            ])
            ->where('status', 'published');

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        if (isset($validated['category_id'])) {
            $query->where(
                'category_id',
                $validated['category_id']
            );
        }

        if (isset($validated['shop_id'])) {
            $query->where(
                'shop_id',
                $validated['shop_id']
            );
        }

        if (isset($validated['min_price'])) {
            $query->where(
                'price',
                '>=',
                $validated['min_price']
            );
        }

        if (isset($validated['max_price'])) {
            $query->where(
                'price',
                '<=',
                $validated['max_price']
            );
        }

        match ($validated['sort'] ?? 'newest') {
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'popular' => $query->orderByDesc('created_at'),
            'rating' => $query->orderByDesc('created_at'),
            default => $query->latest(),
        };

        $products = $query->paginate(
            $validated['per_page'] ?? 12
        );

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        if ($product->status !== 'published') {
            abort(404);
        }

        $product->load([
            'shop:id,seller_id,name,description,status',
            'category:id,name,parent_id',
            'images:id,product_id,path,is_primary,sort_order',
        ]);

        return response()->json([
            'data' => [
                ...$product->toArray(),
                'is_available' => $product->stock > 0,
                'is_low_stock' => $product->stock <= $product->alert_threshold,
            ],
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        Gate::forUser($request->user())->authorize(
            'create',
            Product::class
        );

        $user = $request->user();

        $shop = Shop::findOrFail(
            $request->integer('shop_id')
        );

        if (
            $user->role?->name === 'seller'
            && $shop->seller_id !== $user->id
        ) {
            return response()->json([
                'message' => 'You can only manage your own shop.',
            ], 403);
        }

        $data = $request->validated();

        $data['status'] = $user->role?->name === 'admin'
            ? ($data['status'] ?? 'draft')
            : 'pending';

        $product = Product::create($data);

        $product->load([
            'shop',
            'category',
            'images',
        ]);

        return response()->json([
            'message' => 'Product created successfully.',
            'data' => $product,
        ], 201);
    }

    public function update(
        UpdateProductRequest $request,
        Product $product
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'update',
            $product
        );

        $user = $request->user();

        if (
            $user->role?->name === 'seller'
            && $request->filled('shop_id')
        ) {
            $newShop = Shop::findOrFail(
                $request->integer('shop_id')
            );

            if ($newShop->seller_id !== $user->id) {
                return response()->json([
                    'message' => 'You cannot move a product to another seller shop.',
                ], 403);
            }
        }

        $product->update($request->validated());

        return response()->json([
            'message' => 'Product updated successfully.',
            'data' => $product->fresh([
                'shop',
                'category',
                'images',
            ]),
        ]);
    }

    public function destroy(
        Request $request,
        Product $product
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'delete',
            $product
        );

        $product->update([
            'status' => 'draft',
        ]);

        return response()->json([
            'message' => 'Product disabled successfully.',
        ]);
    }

    public function approve(
        Request $request,
        Product $product
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'approve',
            $product
        );

        if (!in_array($product->status, ['pending', 'draft'], true)) {
            return response()->json([
                'message' => 'Only draft or pending products can be approved.',
            ], 422);
        }

        $product->update([
            'status' => 'approved',
        ]);

        $this->auditLogService->create(
            $request->user(),
            'product_approved',
            $product,
            "Product {$product->name} was approved.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Product approved successfully.',
            'data' => $product->fresh(),
        ]);
    }

    public function publish(
        Request $request,
        Product $product
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'publish',
            $product
        );

        if ($product->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved products can be published.',
            ], 422);
        }

        $product->update([
            'status' => 'published',
        ]);

        $this->auditLogService->create(
            $request->user(),
            'product_published',
            $product,
            "Product {$product->name} was published.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Product published successfully.',
            'data' => $product->fresh(),
        ]);
    }

    public function reject(
        Request $request,
        Product $product
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'reject',
            $product
        );

        if (!in_array($product->status, ['pending', 'approved'], true)) {
            return response()->json([
                'message' => 'Only pending or approved products can be rejected.',
            ], 422);
        }

        $product->update([
            'status' => 'rejected',
        ]);

        $this->auditLogService->create(
            $request->user(),
            'product_rejected',
            $product,
            "Product {$product->name} was rejected.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Product rejected successfully.',
            'data' => $product->fresh(),
        ]);
    }
}
