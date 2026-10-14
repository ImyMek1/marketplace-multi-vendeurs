<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CheckoutConcurrencyTest extends TestCase
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
            $table->foreignId('role_id')->nullable();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('status')->default('active');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('label');
            $table->string('recipient_name');
            $table->string('phone');
            $table->text('address_line');
            $table->string('city');
            $table->string('postal_code')->nullable();
            $table->text('additional_info')->nullable();
            $table->timestamps();
        });

        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->timestamps();
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cart_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedInteger('quantity');
            $table->timestamps();
        });

        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id');
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
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('alert_threshold')->default(5);
            $table->string('status');
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('address_id')->nullable();
            $table->string('order_number')->unique();
            $table->string('recipient_name');
            $table->string('phone');
            $table->text('address_line');
            $table->string('city');
            $table->string('postal_code')->nullable();
            $table->text('additional_info')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('status');
            $table->unsignedBigInteger('coupon_id')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
        });

        Schema::create('seller_order_fulfillments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id');
            $table->foreignId('seller_id');
            $table->enum('status', [
                'pending',
                'confirmed',
                'prepared',
                'cancelled',
            ])->default('pending');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('prepared_at')->nullable();
            $table->timestamps();
            $table->unique(['order_id', 'seller_id']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id')->unique();
            $table->string('method');
            $table->string('status');
            $table->string('reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type');
            $table->text('content');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function test_successful_checkout_deducts_stock_and_creates_order_payment_atomically(): void
    {
        [$client, $address, $cart] = $this->checkoutContext();

        $firstProduct = $this->makeProduct('Seller One item', 5, 11, 1);
        $secondProduct = $this->makeProduct('Seller Two item', 4, 22, 2);

        $cart->items()->create([
            'product_id' => $firstProduct->id,
            'quantity' => 2,
        ]);

        $cart->items()->create([
            'product_id' => $secondProduct->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/v1/orders', [
                'address_id' => $address->id,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.payment.method', 'cash_on_delivery')
            ->assertJsonPath('data.payment.status', 'pending');

        $this->assertSame(3, (int) $firstProduct->fresh()->stock);
        $this->assertSame(3, (int) $secondProduct->fresh()->stock);

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_items', 2);
        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseCount('seller_order_fulfillments', 2);
        $this->assertDatabaseCount('cart_items', 0);

        $order = Order::firstOrFail();

        $this->assertSame(
            2,
            $order->sellerFulfillments()->count()
        );

        $this->assertSame(
            2,
            $order->sellerFulfillments()
                ->where('status', 'pending')
                ->count()
        );
    }

    public function test_empty_cart_checkout_returns_validation_error_without_creating_records(): void
    {
        [$client, $address] = $this->checkoutContext();

        $this->actingAs($client, 'sanctum')
            ->postJson('/api/v1/orders', [
                'address_id' => $address->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cart');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseCount('seller_order_fulfillments', 0);
    }

    public function test_repeated_checkout_of_consumed_cart_fails_without_duplicate_order(): void
    {
        [$client, $address, $cart] = $this->checkoutContext();

        $product = $this->makeProduct('Repeat checkout item', 5, 1, 1);

        $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $client = $this->actingAs($client, 'sanctum');

        $client->postJson('/api/v1/orders', [
            'address_id' => $address->id,
        ])->assertCreated();

        $client->postJson('/api/v1/orders', [
            'address_id' => $address->id,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cart');

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseCount('seller_order_fulfillments', 1);

        $this->assertSame(3, (int) $product->fresh()->stock);
    }

    public function test_competing_submissions_for_same_cart_create_only_one_order(): void
    {
        [$client, $address, $cart] = $this->checkoutContext();

        $product = $this->makeProduct('Concurrent item', 10, 1, 1);

        $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $client = $this->actingAs($client, 'sanctum');

        $first = $client->postJson('/api/v1/orders', [
            'address_id' => $address->id,
        ]);

        $second = $client->postJson('/api/v1/orders', [
            'address_id' => $address->id,
        ]);

        $first->assertCreated();

        $second->assertUnprocessable()
            ->assertJsonValidationErrors('cart');

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseCount('seller_order_fulfillments', 1);

        $this->assertSame(9, (int) $product->fresh()->stock);
    }

    public function test_failed_stock_validation_leaves_no_partial_order_payment_or_stock_change(): void
    {
        [$client, $address, $cart] = $this->checkoutContext();

        $availableProduct = $this->makeProduct('Available item', 5, 1, 1);
        $unavailableProduct = $this->makeProduct('Insufficient item', 1, 2, 2);

        $cart->items()->create([
            'product_id' => $availableProduct->id,
            'quantity' => 2,
        ]);

        $cart->items()->create([
            'product_id' => $unavailableProduct->id,
            'quantity' => 2,
        ]);

        $this->actingAs($client, 'sanctum')
            ->postJson('/api/v1/orders', [
                'address_id' => $address->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cart');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseCount('seller_order_fulfillments', 0);
        $this->assertDatabaseCount('cart_items', 2);

        $this->assertSame(5, (int) $availableProduct->fresh()->stock);
        $this->assertSame(1, (int) $unavailableProduct->fresh()->stock);
    }

    private function checkoutContext(): array
    {
        $clientRole = Role::firstOrCreate([
            'name' => 'client',
        ]);

        $client = User::factory()->create([
            'role_id' => $clientRole->id,
            'status' => 'active',
        ]);

        $address = Address::create([
            'user_id' => $client->id,
            'label' => 'Home',
            'recipient_name' => 'Checkout Customer',
            'phone' => '0600000000',
            'address_line' => '1 Marketplace Road',
            'city' => 'Casablanca',
            'postal_code' => '20000',
        ]);

        $cart = Cart::create([
            'user_id' => $client->id,
        ]);

        return [$client, $address, $cart];
    }

    private function makeProduct(
        string $name,
        int $stock,
        int $shopId,
        int $categoryId
    ): Product {
        $sellerRole = Role::firstOrCreate([
            'name' => 'seller',
        ]);

        $seller = User::factory()->create([
            'role_id' => $sellerRole->id,
            'status' => 'active',
        ]);

        DB::table('shops')->insert([
            'id' => $shopId,
            'seller_id' => $seller->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return Product::create([
            'shop_id' => $shopId,
            'category_id' => $categoryId,
            'name' => $name,
            'price' => 50,
            'stock' => $stock,
            'alert_threshold' => 1,
            'status' => 'published',
        ]);
    }
}
