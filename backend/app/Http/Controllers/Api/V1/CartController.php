<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        private CartService $cartService
    ) {
    }

    public function show(Request $request): JsonResponse
    {
        $cart = $this->cartService
            ->getOrCreateCart($request->user()->id)
            ->load([
                'items.product.shop',
                'items.product.category',
                'items.product.images',
            ]);

        return response()->json([
            'data' => $cart,
        ]);
    }

    public function store(
        AddCartItemRequest $request
    ): JsonResponse {
        $cart = $this->cartService->addItem(
            $request->user()->id,
            $request->integer('product_id'),
            $request->integer('quantity')
        );

        return response()->json([
            'message' => 'Product added to cart successfully.',
            'data' => $cart,
        ], 201);
    }

    public function update(
        UpdateCartItemRequest $request,
        int $item
    ): JsonResponse {
        $cart = $this->cartService->updateItem(
            $request->user()->id,
            $item,
            $request->integer('quantity')
        );

        return response()->json([
            'message' => 'Cart item updated successfully.',
            'data' => $cart,
        ]);
    }

    public function destroy(
        Request $request,
        int $item
    ): JsonResponse {
        $cart = $this->cartService->removeItem(
            $request->user()->id,
            $item
        );

        return response()->json([
            'message' => 'Cart item removed successfully.',
            'data' => $cart,
        ]);
    }
}