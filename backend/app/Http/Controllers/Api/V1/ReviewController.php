<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Models\Review;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReviewController extends Controller
{
    public function __construct(
        private ReviewService $reviewService,
        private NotificationService $notificationService,
        private AuditLogService $auditLogService
    ) {
    }

    public function store(
        StoreReviewRequest $request
    ): JsonResponse {
        $review = $this->reviewService->createReview(
            $request->user(),
            $request->integer('product_id'),
            $request->integer('rating'),
            $request->validated('comment')
        );

        return response()->json([
            'message' => 'Review submitted successfully.',
            'data' => $review->load('product'),
        ], 201);
    }

    public function productReviews(
        Request $request,
        int $productId
    ): JsonResponse {
        $reviews = Review::query()
            ->where('product_id', $productId)
            ->where('status', 'approved')
            ->with('user:id,name')
            ->latest()
            ->paginate(10);

        return response()->json($reviews);
    }

    public function myReviews(
        Request $request
    ): JsonResponse {
        $reviews = Review::query()
            ->where('user_id', $request->user()->id)
            ->with('product:id,name')
            ->latest()
            ->paginate(10);

        return response()->json($reviews);
    }

    public function approve(
        Request $request,
        Review $review
    ): JsonResponse {
        Gate::forUser($request->user())
            ->authorize('moderate', $review);

        $review->load('product', 'user');

        $review->update([
            'status' => 'approved',
        ]);

        $this->notificationService->create(
            $review->user,
            'review_approved',
            "Your review for {$review->product->name} has been approved."
        );

        $this->auditLogService->create(
            $request->user(),
            'review_approved',
            $review,
            "Review {$review->id} for product {$review->product->name} was approved.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Review approved successfully.',
            'data' => $review->fresh()->load('product', 'user'),
        ]);
    }

    public function reject(
        Request $request,
        Review $review
    ): JsonResponse {
        Gate::forUser($request->user())
            ->authorize('moderate', $review);

        $review->load('product', 'user');

        $review->update([
            'status' => 'rejected',
        ]);

        $this->notificationService->create(
            $review->user,
            'review_rejected',
            "Your review for {$review->product->name} has been rejected."
        );

        $this->auditLogService->create(
            $request->user(),
            'review_rejected',
            $review,
            "Review {$review->id} for product {$review->product->name} was rejected.",
            $request->ip()
        );

        return response()->json([
            'message' => 'Review rejected successfully.',
            'data' => $review->fresh()->load('product', 'user'),
        ]);
    }
}