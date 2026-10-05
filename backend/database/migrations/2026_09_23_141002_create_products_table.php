<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('shop_id')
                ->constrained('shops')
                ->restrictOnDelete();

            $table->foreignId('category_id')
                ->constrained('categories')
                ->restrictOnDelete();

            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->string('brand', 150)->nullable();

            $table->decimal('price', 10, 2);
            $table->decimal('promotional_price', 10, 2)->nullable();

            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('alert_threshold')->default(5);

            $table->enum('status', [
                'draft',
                'pending',
                'approved',
                'published',
                'rejected',
            ])->default('draft');

            $table->timestamps();

            $table->index('shop_id');
            $table->index('category_id');
            $table->index('status');
            $table->index(['category_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
