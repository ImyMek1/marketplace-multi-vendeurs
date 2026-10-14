<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PublicProductVisibilityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('seller_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status');
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('name');
            $table->string('status');
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shop_id');
            $table->unsignedBigInteger('category_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('brand')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('promotional_price', 10, 2)->nullable();
            $table->integer('stock');
            $table->integer('alert_threshold');
            $table->string('status');
            $table->timestamps();
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->string('path');
            $table->boolean('is_primary')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function test_public_product_endpoints_hide_products_from_inactive_shops(): void
    {
        $category = Category::create([
            'name' => 'Test category',
            'status' => 'active',
        ]);
        $activeShop = Shop::create([
            'seller_id' => 1,
            'name' => 'Active shop',
            'status' => 'active',
        ]);
        $suspendedShop = Shop::create([
            'seller_id' => 2,
            'name' => 'Suspended shop',
            'status' => 'suspended',
        ]);

        $activeProduct = $this->makePublishedProduct($activeShop->id, $category->id, 'Visible product');
        $suspendedProduct = $this->makePublishedProduct($suspendedShop->id, $category->id, 'Hidden product');

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeProduct->id);

        $this->getJson("/api/v1/products/{$activeProduct->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $activeProduct->id);

        $this->getJson("/api/v1/products/{$suspendedProduct->id}")
            ->assertNotFound();
    }

    private function makePublishedProduct(int $shopId, int $categoryId, string $name): Product
    {
        return Product::create([
            'shop_id' => $shopId,
            'category_id' => $categoryId,
            'name' => $name,
            'description' => 'Test product',
            'brand' => 'Test brand',
            'price' => 100,
            'stock' => 5,
            'alert_threshold' => 1,
            'status' => 'published',
        ]);
    }
}
