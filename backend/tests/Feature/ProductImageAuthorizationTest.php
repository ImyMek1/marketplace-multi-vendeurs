<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Role;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductImageAuthorizationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->nullable()->constrained('roles');
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('status', ['active', 'suspended'])->default('active');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

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

    public function test_client_cannot_delete_a_product_image(): void
    {
        Storage::fake('public');

        $clientRole = Role::create(['name' => 'client']);
        $client = User::factory()->create([
            'role_id' => $clientRole->id,
            'status' => 'active',
        ]);
        $seller = User::factory()->create([
            'role_id' => Role::create(['name' => 'seller'])->id,
            'status' => 'active',
        ]);
        $shop = Shop::create([
            'seller_id' => $seller->id,
            'name' => 'Seller shop',
            'status' => 'active',
        ]);
        $category = Category::create([
            'name' => 'Products',
            'status' => 'active',
        ]);
        $product = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $category->id,
            'name' => 'Product with image',
            'price' => 100,
            'stock' => 2,
            'alert_threshold' => 1,
            'status' => 'published',
        ]);
        $image = ProductImage::create([
            'product_id' => $product->id,
            'path' => 'products/1/image.jpg',
            'is_primary' => true,
            'sort_order' => 0,
        ]);
        Storage::disk('public')->put($image->path, 'test image');

        $this->withToken($client->createToken('client')->plainTextToken)
            ->deleteJson("/api/v1/product-images/{$image->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('product_images', ['id' => $image->id]);
        $this->assertTrue(Storage::disk('public')->exists($image->path));
    }
}
