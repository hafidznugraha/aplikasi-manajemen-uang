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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('budget_id')->constrained('budgets')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('subcategory_id')->nullable()->constrained('subcategories')->nullOnDelete();
            $table->date('date'); // Tanggal pengeluaran
            $table->string('description'); // Keterangan transaksi
            $table->bigInteger('amount'); // Nominal pengeluaran dalam Rupiah (> 0)
            $table->text('receipt_url')->nullable(); // URL foto struk di Supabase Storage
            $table->timestamps();

            // Indexes untuk optimasi query filter dan sorting
            $table->index(['budget_id', 'date']);
            $table->index(['category_id', 'date']);
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
