<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->unique()
                ->constrained('orders')
                ->cascadeOnDelete();

            $table->enum('method', [
                'cash_on_delivery',
                'online',
            ])->default('cash_on_delivery');

            $table->enum('status', [
                'pending',
                'paid',
                'failed',
            ])->default('pending');

            $table->string('reference', 150)->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};