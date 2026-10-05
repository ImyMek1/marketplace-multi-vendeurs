<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductImageRequest;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    public function store(
        StoreProductImageRequest $request,
        Product $product
    ): JsonResponse {
        $user = $request->user();

        if (
            $user->role?->name === 'seller'
            && $product->shop?->seller_id !== $user->id
        ) {
            return response()->json([
                'message' => 'You can only manage your own products.',
            ], 403);
        }

        $images = $request->file('images');
        $primaryIndex = $request->integer('primary_index', 0);
        $hasExistingPrimary = $product->images()
            ->where('is_primary', true)
            ->exists();

        $createdImages = [];

        DB::transaction(function () use (
            $product,
            $images,
            $primaryIndex,
            $hasExistingPrimary,
            &$createdImages
        ) {
            $existingImages = $product->images()->count();

            foreach ($images as $index => $image) {
                $path = $image->store(
                    'products/' . $product->id,
                    'public'
                );

                $isPrimary = !$hasExistingPrimary
                    && $index === $primaryIndex;

                $createdImages[] = ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $path,
                    'is_primary' => $isPrimary,
                    'sort_order' => $existingImages + $index,
                ]);
            }

            if (
                !$hasExistingPrimary
                && !collect($createdImages)->contains(
                    fn (ProductImage $image) => $image->is_primary
                )
                && !empty($createdImages)
            ) {
                $createdImages[0]->update([
                    'is_primary' => true,
                ]);
            }
        });

        return response()->json([
            'message' => 'Product images uploaded successfully.',
            'data' => $product->fresh('images'),
        ], 201);
    }

    public function destroy(
        Request $request,
        ProductImage $productImage
    ): JsonResponse {
        $user = $request->user();
        $product = $productImage->product;

        if (
            $user->role?->name === 'seller'
            && $product?->shop?->seller_id !== $user->id
        ) {
            return response()->json([
                'message' => 'You can only manage your own product images.',
            ], 403);
        }

        $wasPrimary = $productImage->is_primary;

        Storage::disk('public')->delete(
            $productImage->path
        );

        DB::transaction(function () use (
            $productImage,
            $product,
            $wasPrimary
        ) {
            $productImage->delete();

            if ($wasPrimary && $product) {
                $nextImage = $product->images()
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->first();

                if ($nextImage) {
                    $nextImage->update([
                        'is_primary' => true,
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Product image deleted successfully.',
        ]);
    }
}