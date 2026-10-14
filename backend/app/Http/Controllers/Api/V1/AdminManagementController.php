<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdminUserStatusRequest;
use App\Models\Category;
use App\Models\Commission;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\Shop;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AdminManagementController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {}

    public function users(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::in(['admin', 'seller', 'driver', 'client'])],
            'status' => ['nullable', Rule::in(['active', 'suspended'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = User::query()
            ->select(['id', 'role_id', 'name', 'email', 'phone', 'status', 'created_at'])
            ->with('role:id,name');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['role'])) {
            $query->whereHas('role', fn($builder) => $builder->where('name', $filters['role']));
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return response()->json($query->latest()->paginate($filters['per_page'] ?? 15));
    }

    public function user(Request $request, User $user): JsonResponse
    {
        $user->load('role:id,name');

        return response()->json([
            'data' => $user->only(['id', 'name', 'email', 'phone', 'status', 'created_at', 'role']),
        ]);
    }

    public function updateUserStatus(UpdateAdminUserStatusRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();

        if ($user->is($request->user()) || $user->role?->name === 'admin') {
            return response()->json([
                'message' => 'Admin accounts cannot be changed here.',
            ], 403);
        }

        $oldStatus = $user->status;
        $user->status = $validated['status'];
        $user->save();

        if ($validated['status'] === 'suspended') {
            $user->tokens()->delete();
        }

        $this->auditLogService->create(
            $request->user(),
            'user_status_changed',
            $user,
            "User {$user->id} status changed from {$oldStatus} to {$validated['status']}.",
            $request->ip()
        );

        return response()->json([
            'message' => 'User status updated successfully.',
            'data' => $user->fresh('role:id,name')->only(['id', 'name', 'email', 'phone', 'status', 'created_at', 'role']),
        ]);
    }

    public function shops(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['pending', 'active', 'suspended'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        Gate::authorize('viewAny', Shop::class);
        $query = Shop::query()->with('seller:id,name,email')->withCount('products');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhereHas('seller', function ($sellerQuery) use ($search) {
                        $sellerQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return response()->json($query->latest()->paginate($filters['per_page'] ?? 15));
    }

    public function shop(Request $request, Shop $shop): JsonResponse
    {
        Gate::authorize('view', $shop);
        $shop->load('seller:id,name,email,phone')->loadCount('products');

        return response()->json(['data' => $shop]);
    }

    public function products(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['draft', 'pending', 'approved', 'published', 'rejected'])],
            'shop_id' => ['nullable', 'integer', 'exists:shops,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        Gate::authorize('viewAny', Product::class);
        $query = Product::query()->with([
            'shop:id,seller_id,name',
            'category:id,name',
            'images:id,product_id,path,is_primary,sort_order',
        ]);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        foreach (['status', 'shop_id', 'category_id'] as $field) {
            if (isset($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        return response()->json($query->latest()->paginate($filters['per_page'] ?? 15));
    }

    public function product(Request $request, Product $product): JsonResponse
    {
        Gate::authorize('view', $product);
        $product->load([
            'shop:id,seller_id,name',
            'category:id,name',
            'images:id,product_id,path,is_primary,sort_order',
        ]);

        return response()->json(['data' => $product]);
    }

    public function orders(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['pending', 'confirmed', 'prepared', 'shipped', 'delivered', 'cancelled'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        Gate::authorize('viewAny', Order::class);
        $query = Order::query()->with([
            'user:id,name,email,phone',
            'delivery.driver:id,name,email,phone',
        ]);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder->where('order_number', 'like', "%{$search}%")
                    ->orWhere('recipient_name', 'like', "%{$search}%")
                    ->orWhereHas('user', fn($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return response()->json($query->latest()->paginate($filters['per_page'] ?? 15));
    }

    public function order(Request $request, Order $order): JsonResponse
    {
        Gate::authorize('view', $order);
        $order->load([
            'user:id,name,email,phone',
            'items.product.shop:id,name',
            'items.product.images:id,product_id,path,is_primary,sort_order',
            'payment',
            'delivery.driver:id,name,email,phone',
            'delivery.statusHistories.changedBy:id,name',
            'commissions.seller:id,name',
        ]);

        return response()->json(['data' => $order]);
    }

    public function reviews(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        Gate::authorize('viewAny', Review::class);
        $query = Review::query()->with(['user:id,name', 'product:id,name']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('product', fn($productQuery) => $productQuery->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('user', fn($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return response()->json($query->latest()->paginate($filters['per_page'] ?? 15));
    }

    public function categories(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Category::class);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Category::query()->with('parent:id,name')->withCount('products');
        if (!empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return response()->json($query->orderBy('name')->paginate($filters['per_page'] ?? 15));
    }

    public function commissions(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Commission::query()->with([
            'order:id,order_number,status,total',
            'seller:id,name,email',
        ]);
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder->whereHas('order', fn($orderQuery) => $orderQuery->where('order_number', 'like', "%{$search}%"))
                    ->orWhereHas('seller', fn($sellerQuery) => $sellerQuery->where('name', 'like', "%{$search}%"));
            });
        }

        $total = (float) Commission::sum('amount');
        $records = $query->latest()->paginate($filters['per_page'] ?? 15);

        return response()->json([
            'data' => $records->items(),
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
                'total_commissions' => $total,
            ],
            'links' => [
                'first' => $records->url(1),
                'last' => $records->url($records->lastPage()),
                'prev' => $records->previousPageUrl(),
                'next' => $records->nextPageUrl(),
            ],
        ]);
    }
}
