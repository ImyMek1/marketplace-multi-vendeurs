<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DriverAssignmentTest extends TestCase
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
            $table->string('phone')->nullable();
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

        Schema::create('seller_order_fulfillments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id');
            $table->foreignId('seller_id');
            $table->string('status')->default('pending');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('prepared_at')->nullable();
            $table->timestamps();
            $table->unique(['order_id', 'seller_id']);
        });

        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id')->unique();
            $table->unsignedBigInteger('driver_id')->nullable();
            $table->string('status');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('in_transit')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_status_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('delivery_id');
            $table->string('status');
            $table->unsignedBigInteger('changed_by')->nullable();
            $table->text('note')->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type');
            $table->text('content');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('action');
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('description')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function test_active_driver_can_be_assigned_to_prepared_order(): void
    {
        $admin = $this->makeUser('admin', 'active', 'admin@example.test');
        $driver = $this->makeUser('driver', 'active', 'driver@example.test');
        $order = $this->makeOrder('prepared');

        $response = $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/v1/admin/orders/{$order->id}/delivery/assign", [
                'driver_id' => $driver->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.driver_id', $driver->id)
            ->assertJsonPath('data.order_id', $order->id)
            ->assertJsonPath('data.status', 'assigned');
    }

    public function test_client_or_seller_cannot_be_assigned_as_driver(): void
    {
        $admin = $this->makeUser('admin', 'active', 'admin@example.test');
        $order = $this->makeOrder('prepared');
        $adminToken = $admin->createToken('admin')->plainTextToken;

        foreach (['client', 'seller'] as $role) {
            $user = $this->makeUser($role, 'active', "{$role}@example.test");

            $this->withToken($adminToken)
                ->patchJson("/api/v1/admin/orders/{$order->id}/delivery/assign", [
                    'driver_id' => $user->id,
                ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('driver_id');
        }
    }

    public function test_suspended_driver_cannot_be_assigned(): void
    {
        $admin = $this->makeUser('admin', 'active', 'admin@example.test');
        $driver = $this->makeUser('driver', 'suspended', 'driver@example.test');
        $order = $this->makeOrder('prepared');

        $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/v1/admin/orders/{$order->id}/delivery/assign", [
                'driver_id' => $driver->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('driver_id');
    }

    public function test_nonexistent_driver_id_returns_validation_error(): void
    {
        $admin = $this->makeUser('admin', 'active', 'admin@example.test');
        $order = $this->makeOrder('prepared');

        $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/v1/admin/orders/{$order->id}/delivery/assign", [
                'driver_id' => 99999,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('driver_id');
    }

    public function test_unauthorized_user_cannot_assign_driver(): void
    {
        $client = $this->makeUser('client', 'active', 'client@example.test');
        $driver = $this->makeUser('driver', 'active', 'driver@example.test');
        $order = $this->makeOrder('prepared');

        $this->withToken($client->createToken('client')->plainTextToken)
            ->patchJson("/api/v1/admin/orders/{$order->id}/delivery/assign", [
                'driver_id' => $driver->id,
            ])
            ->assertForbidden();
    }

    public function test_order_must_be_prepared_before_driver_assignment(): void
    {
        $admin = $this->makeUser('admin', 'active', 'admin@example.test');
        $driver = $this->makeUser('driver', 'active', 'driver@example.test');
        $order = $this->makeOrder('pending');

        $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/v1/admin/orders/{$order->id}/delivery/assign", [
                'driver_id' => $driver->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('order');
    }

    public function test_driver_cannot_be_assigned_until_all_sellers_are_prepared(): void
    {
        $admin = $this->makeUser('admin', 'active', 'admin@example.test');
        $driver = $this->makeUser('driver', 'active', 'driver@example.test');
        $order = $this->makeOrder('prepared');

        $secondSeller = $this->makeUser(
            'seller',
            'active',
            'second-seller@example.test'
        );

        $order->sellerFulfillments()->create([
            'seller_id' => $secondSeller->id,
            'status' => 'confirmed',
        ]);

        $this->withToken($admin->createToken('admin')->plainTextToken)
            ->patchJson("/api/v1/admin/orders/{$order->id}/delivery/assign", [
                'driver_id' => $driver->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('order');

        $this->assertDatabaseCount('deliveries', 0);
    }

    private function makeUser(
        string $roleName,
        string $status,
        string $email
    ): User {
        $role = Role::firstOrCreate(['name' => $roleName]);

        $user = User::create([
            'role_id' => $role->id,
            'name' => ucfirst($roleName),
            'email' => $email,
            'password' => 'password',
        ]);

        $user->status = $status;
        $user->save();

        return $user;
    }

    private function makeOrder(string $status): Order
    {
        $client = $this->makeUser(
            'client',
            'active',
            uniqid('client-', true) . '@example.test'
        );

        $order = Order::create([
            'user_id' => $client->id,
            'order_number' => uniqid('ORD-', true),
            'recipient_name' => 'Recipient Name',
            'phone' => '0600000000',
            'address_line' => '1 Marketplace Street',
            'city' => 'Casablanca',
            'subtotal' => 100,
            'delivery_fee' => 10,
            'discount' => 0,
            'total' => 110,
            'status' => $status,
        ]);

        $seller = $this->makeUser(
            'seller',
            'active',
            uniqid('seller-', true) . '@example.test'
        );

        $order->sellerFulfillments()->create([
            'seller_id' => $seller->id,
            'status' => $status === 'prepared' ? 'prepared' : 'pending',
        ]);

        return $order;
    }
}
