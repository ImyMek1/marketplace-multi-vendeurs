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
        Schema::create('shops', function (Blueprint $table) {
            $table->id();

            $table->foreignId('seller_id')
                ->unique()
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('name', 200);
            $table->text('description')->nullable();

            $table->enum('status', [
                'pending',
                'active',
                'suspended',
            ])->default('pending');

            $table->timestamps();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shops');
    }
};
