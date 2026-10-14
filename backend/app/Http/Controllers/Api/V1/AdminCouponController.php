<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCouponRequest;
use App\Http\Requests\UpdateCouponRequest;
use App\Models\Coupon;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminCouponController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Coupon::query();
        if (!empty($filters['search'])) {
            $query->where('code', 'like', "%{$filters['search']}%");
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return response()->json($query->latest()->paginate($filters['per_page'] ?? 15));
    }

    public function show(Coupon $coupon): JsonResponse
    {
        return response()->json(['data' => $coupon]);
    }

    public function store(StoreCouponRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['code'] = strtoupper($data['code']);
        $data['min_order_amount'] ??= 0;

        $coupon = Coupon::create($data);
        $this->auditLogService->create(
            $request->user(),
            'coupon_created',
            $coupon,
            "Coupon {$coupon->code} was created.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Coupon created successfully.',
            'data' => $coupon,
        ], 201);
    }

    public function update(UpdateCouponRequest $request, Coupon $coupon): JsonResponse
    {
        $data = $request->validated();
        $data['code'] = strtoupper($data['code']);
        $data['min_order_amount'] ??= 0;

        $coupon->update($data);
        $this->auditLogService->create(
            $request->user(),
            'coupon_updated',
            $coupon,
            "Coupon {$coupon->code} was updated.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Coupon updated successfully.',
            'data' => $coupon->fresh(),
        ]);
    }

    public function updateStatus(Request $request, Coupon $coupon): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);
        $coupon->update(['status' => $validated['status']]);

        $this->auditLogService->create(
            $request->user(),
            'coupon_status_changed',
            $coupon,
            "Coupon {$coupon->code} status changed to {$validated['status']}.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Coupon status updated successfully.',
            'data' => $coupon->fresh(),
        ]);
    }
}
