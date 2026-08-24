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
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('month', 7); // Format: 'YYYY-MM' (contoh: '2026-08')
            $table->bigInteger('total_budget')->default(0); // Nilai nominal dalam Rupiah
            $table->timestamps();

            // Memastikan satu user hanya memiliki satu entri budget per periode bulan
            $table->unique(['user_id', 'month']);
            $table->index('month');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
