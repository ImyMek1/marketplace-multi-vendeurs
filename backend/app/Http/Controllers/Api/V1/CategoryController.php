<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->where('status', 'active')
            ->whereNull('parent_id')
            ->with([
                'children' => function ($query) {
                    $query->where('status', 'active')
                        ->orderBy('name');
                },
            ])
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function show(Category $category): JsonResponse
    {
        if ($category->status !== 'active') {
            abort(404);
        }

        $category->load([
            'parent',
            'children' => function ($query) {
                $query->where('status', 'active')
                    ->orderBy('name');
            },
        ]);

        return response()->json([
            'data' => $category,
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        Gate::forUser($request->user())->authorize(
            'create',
            Category::class
        );

        $category = Category::create($request->validated());

        return response()->json([
            'message' => 'Category created successfully.',
            'data' => $category,
        ], 201);
    }

    public function update(
        UpdateCategoryRequest $request,
        Category $category
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'update',
            $category
        );

        $category->update($request->validated());

        return response()->json([
            'message' => 'Category updated successfully.',
            'data' => $category->fresh(),
        ]);
    }

    public function destroy(
        \Illuminate\Http\Request $request,
        Category $category
    ): JsonResponse {
        Gate::forUser($request->user())->authorize(
            'delete',
            $category
        );

        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'This category cannot be deleted because it contains products.',
            ], 409);
        }

        if ($category->children()->exists()) {
            return response()->json([
                'message' => 'This category cannot be deleted because it contains subcategories.',
            ], 409);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }
}