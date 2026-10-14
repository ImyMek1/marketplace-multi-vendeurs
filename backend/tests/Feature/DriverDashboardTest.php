<?php

namespace Tests\Feature;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DriverDashboardTest extends TestCase
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
            $table->unsignedBigInteger('changed_by')->nullable();
            $table->text('note')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function test_driver_dashboard_returns_assignment_statistics(): void
    {
        $driverRole = Role::firstOrCreate(['name' => 'driver']);
        $clientRole = Role::firstOrCreate(['name' => 'client']);

        $driver = User::factory()->create([
            'role_id' => $driverRole->id,
            'status' => 'active',
        ]);

        $customer = User::factory()->create([
            'role_id' => $clientRole->id,
            'status' => 'active',
        ]);

        $assignedOrder = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'ORD-ASSIGNED-1',
            'recipient_name' => 'Alice Driver',
            'phone' => '0600000001',
            'address_line' => '12 Rue de la Livraison',
            'city' => 'Casablanca',
            'postal_code' => '20000',
            'subtotal' => 150,
            'delivery_fee' => 10,
            'discount' => 0,
            'total' => 160,
            'status' => 'prepared',
        ]);

        $pickedUpOrder = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'ORD-PICKED-1',
            'recipient_name' => 'Bob Driver',
            'phone' => '0600000002',
            'address_line' => '13 Rue de la Livraison',
            'city' => 'Rabat',
            'postal_code' => '10000',
            'subtotal' => 200,
            'delivery_fee' => 15,
            'discount' => 0,
            'total' => 215,
            'status' => 'prepared',
        ]);

        $inTransitOrder = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'ORD-INTRANSIT-1',
            'recipient_name' => 'Charlie Driver',
            'phone' => '0600000003',
            'address_line' => '14 Rue de la Livraison',
            'city' => 'Marrakech',
            'postal_code' => '40000',
            'subtotal' => 220,
            'delivery_fee' => 20,
            'discount' => 0,
            'total' => 240,
            'status' => 'prepared',
        ]);

        $completedOrder = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'ORD-DELIVERED-1',
            'recipient_name' => 'Dana Driver',
            'phone' => '0600000004',
            'address_line' => '15 Rue de la Livraison',
            'city' => 'Fes',
            'postal_code' => '30000',
            'subtotal' => 300,
            'delivery_fee' => 25,
            'discount' => 0,
            'total' => 325,
            'status' => 'prepared',
        ]);

        $failedOrder = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'ORD-FAILED-1',
            'recipient_name' => 'Evan Driver',
            'phone' => '0600000005',
            'address_line' => '16 Rue de la Livraison',
            'city' => 'Tangier',
            'postal_code' => '90000',
            'subtotal' => 180,
            'delivery_fee' => 12,
            'discount' => 0,
            'total' => 192,
            'status' => 'prepared',
        ]);

        Delivery::create([
            'order_id' => $assignedOrder->id,
            'driver_id' => $driver->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        Delivery::create([
            'order_id' => $pickedUpOrder->id,
            'driver_id' => $driver->id,
            'status' => 'picked_up',
            'assigned_at' => now()->subHour(),
            'picked_up_at' => now(),
        ]);

        Delivery::create([
            'order_id' => $inTransitOrder->id,
            'driver_id' => $driver->id,
            'status' => 'in_transit',
            'assigned_at' => now()->subHours(2),
            'picked_up_at' => now()->subHour(),
            'in_transit_at' => now(),
        ]);

        Delivery::create([
            'order_id' => $completedOrder->id,
            'driver_id' => $driver->id,
            'status' => 'delivered',
            'assigned_at' => now()->subHours(3),
            'picked_up_at' => now()->subHours(2),
            'in_transit_at' => now()->subHour(),
            'delivered_at' => now(),
        ]);

        Delivery::create([
            'order_id' => $failedOrder->id,
            'driver_id' => $driver->id,
            'status' => 'failed',
            'assigned_at' => now()->subHours(4),
            'failed_at' => now(),
            'failure_reason' => 'Customer unreachable.',
        ]);

        $response = $this->actingAs($driver, 'sanctum')
            ->getJson('/api/v1/driver/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.stats.assigned', 1)
            ->assertJsonPath('data.stats.in_progress', 2)
            ->assertJsonPath('data.stats.completed', 1)
            ->assertJsonPath('data.stats.failed', 1)
            ->assertJsonCount(5, 'data.recent_deliveries');
    }
}
