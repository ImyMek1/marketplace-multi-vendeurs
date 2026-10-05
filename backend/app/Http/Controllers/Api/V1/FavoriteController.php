<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Services\FavoriteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function __construct(
        private FavoriteService $favoriteService
    ) {
    }

    public function index(
        Request $request
    ): JsonResponse {
        $favorites = Favorite::query()
            ->where('user_id', $request->user()->id)
            ->with('product.images')
            ->latest()
            ->paginate(10);

        return response()->json($favorites);
    }

    public function store(
        Request $request
    ): JsonResponse {
        $request->validate([
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],
        ]);

        $favorite = $this->favoriteService->add(
            $request->user(),
            $request->integer('product_id')
        );

        return response()->json([
            'message' => 'Product added to favorites successfully.',
            'data' => $favorite->load('product'),
        ], 201);
    }

    public function destroy(
        Request $request,
        int $productId
    ): JsonResponse {
        $this->favoriteService->remove(
            $request->user(),
            $productId
        );

        return response()->json([
            'message' => 'Product removed from favorites successfully.',
        ]);
    }
}