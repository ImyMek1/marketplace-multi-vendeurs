<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
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
            $table->timestamps();
        });

        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('name');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops');
            $table->foreignId('category_id')->constrained('categories');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('brand')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->decimal('promotional_price', 10, 2)->nullable();
            $table->integer('stock')->default(0);
            $table->integer('alert_threshold')->default(5);
            $table->enum('status', ['draft', 'pending', 'approved', 'published', 'rejected'])->default('draft');
            $table->timestamps();
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products');
            $table->string('path');
            $table->boolean('is_primary')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('product_id')->constrained('products');
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->unique();
            $table->enum('type', ['fixed', 'percentage']);
            $table->decimal('value', 10, 2);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->decimal('min_order_amount', 10, 2)->default(0);
            $table->unsignedInteger('max_usage')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->unsignedBigInteger('address_id')->nullable();
            $table->string('order_number', 50)->unique();
            $table->string('recipient_name', 150);
            $table->string('phone', 30);
            $table->text('address_line');
            $table->string('city', 100);
            $table->string('postal_code', 20)->nullable();
            $table->text('additional_info')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->enum('status', ['pending', 'confirmed', 'prepared', 'shipped', 'delivered', 'cancelled'])->default('pending');
            $table->unsignedBigInteger('coupon_id')->nullable();
            $table->timestamps();
        });

        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders');
            $table->foreignId('seller_id')->constrained('users');
            $table->decimal('rate', 5, 2);
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders');
            $table->foreignId('product_id')->constrained('products');
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders');
            $table->string('method')->default('cash_on_delivery');
            $table->string('status')->default('pending');
            $table->string('reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders');
            $table->foreignId('driver_id')->nullable()->constrained('users');
            $table->enum('status', ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'])->default('assigned');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('in_transit_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_id')->constrained('deliveries');
            $table->string('status');
            $table->foreignId('changed_by')->nullable()->constrained('users');
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('action');
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->text('description');
            $table->string('ip_address')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function test_admin_dashboard_returns_platform_stats(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $sellerRole = Role::firstOrCreate(['name' => 'seller']);
        $driverRole = Role::firstOrCreate(['name' => 'driver']);
        $clientRole = Role::firstOrCreate(['name' => 'client']);

        $admin = User::factory()->create([
            'role_id' => $adminRole->id,
            'status' => 'active',
        ]);

        User::factory()->count(2)->create(['role_id' => $clientRole->id, 'status' => 'active']);
        User::factory()->count(3)->create(['role_id' => $sellerRole->id, 'status' => 'active']);
        User::factory()->count(2)->create(['role_id' => $driverRole->id, 'status' => 'active']);

        $shop = \App\Models\Shop::create([
            'seller_id' => User::where('role_id', $sellerRole->id)->first()->id,
            'name' => 'The Market',
            'status' => 'pending',
        ]);

        $category = \App\Models\Category::create([
            'name' => 'Electronics',
            'status' => 'active',
        ]);

        \App\Models\Product::create([
            'shop_id' => $shop->id,
            'category_id' => $category->id,
            'name' => 'Phone',
            'description' => 'Sample',
            'brand' => 'BrandX',
            'price' => 500,
            'stock' => 10,
            'alert_threshold' => 3,
            'status' => 'pending',
        ]);

        $customer = User::where('role_id', $clientRole->id)->first();

        $order = \App\Models\Order::create([
            'user_id' => $customer->id,
            'order_number' => 'ADM-1001',
            'recipient_name' => 'Client A',
            'phone' => '0600000000',
            'address_line' => '1 test st',
            'city' => 'Casablanca',
            'subtotal' => 500,
            'delivery_fee' => 25,
            'discount' => 0,
            'total' => 525,
            'status' => 'delivered',
        ]);

        \App\Models\Delivery::create([
            'order_id' => $order->id,
            'driver_id' => User::where('role_id', $driverRole->id)->first()->id,
            'status' => 'in_transit',
            'assigned_at' => now()->subHour(),
            'picked_up_at' => now()->subMinutes(30),
            'in_transit_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.stats.total_users', 8)
            ->assertJsonPath('data.stats.sellers', 3)
            ->assertJsonPath('data.stats.drivers', 2)
            ->assertJsonPath('data.stats.pending_shops', 1)
            ->assertJsonPath('data.stats.pending_products', 1)
            ->assertJsonPath('data.stats.total_orders', 1)
            ->assertJsonPath('data.stats.total_revenue', 525.0);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/users?role=driver&status=active')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonMissingPath('data.0.password');

        $seller = User::where('role_id', $sellerRole->id)->firstOrFail();
        $this->patchJson("/api/v1/admin/users/{$seller->id}/status", [
            'status' => 'suspended',
        ])->assertOk()
            ->assertJsonPath('data.status', 'suspended');

        $this->postJson('/api/v1/admin/coupons', [
            'code' => 'market10',
            'type' => 'percentage',
            'value' => 10,
            'min_order_amount' => 100,
            'max_usage' => 20,
            'status' => 'active',
        ])->assertCreated()
            ->assertJsonPath('data.code', 'MARKET10')
            ->assertJsonPath('data.min_order_amount', '100.00')
            ->assertJsonPath('data.max_usage', 20);

        $coupon = \App\Models\Coupon::where('code', 'MARKET10')->firstOrFail();
        $this->putJson("/api/v1/admin/coupons/{$coupon->id}", [
            'code' => 'market10',
            'type' => 'percentage',
            'value' => 15,
            'starts_at' => null,
            'expires_at' => null,
            'min_order_amount' => 150,
            'max_usage' => 25,
            'status' => 'active',
        ])->assertOk()
            ->assertJsonPath('data.value', '15.00');
        $this->patchJson("/api/v1/admin/coupons/{$coupon->id}/status", [
            'status' => 'inactive',
        ])->assertOk()
            ->assertJsonPath('data.status', 'inactive');

        $newCategory = $this->postJson('/api/v1/admin/categories', [
            'name' => 'Accessories',
            'status' => 'active',
        ])->assertCreated()->json('data');
        $this->putJson("/api/v1/admin/categories/{$newCategory['id']}", [
            'name' => 'Homewares',
            'status' => 'active',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Homewares');
        $this->deleteJson("/api/v1/admin/categories/{$newCategory['id']}")
            ->assertOk();

        $this->getJson('/api/v1/admin/products')
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/admin/orders')
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/admin/shops')
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->getJson("/api/v1/admin/shops/{$shop->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'The Market');
        $product = \App\Models\Product::firstOrFail();
        $this->getJson("/api/v1/admin/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Phone');
        $this->getJson("/api/v1/admin/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.order_number', 'ADM-1001');
        $this->getJson('/api/v1/admin/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/admin/reviews')
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/admin/coupons')
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/admin/commissions')
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/admin/deliveries')
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $delivery = \App\Models\Delivery::firstOrFail();
        $this->getJson("/api/v1/admin/deliveries/{$delivery->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $delivery->id);
        $this->getJson("/api/v1/admin/deliveries/{$delivery->id}/history")
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->actingAs(User::where('role_id', $clientRole->id)->firstOrFail(), 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertForbidden();
    }
}
