<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetTest extends TestCase
{
    use RefreshDatabase;

    public function test_budget_and_categories_are_isolated_by_month(): void
    {
        // 1. Setup data bulan lalu (misal 2026-08)
        $prevMonth = '2026-08';
        $prevBudget = Budget::create([
            'month' => $prevMonth,
            'total_budget' => 5000000,
            'total_cash' => 1000000,
        ]);

        $cat1 = Category::create([
            'budget_id' => $prevBudget->id,
            'name' => 'Makanan & Minuman',
            'budget_amount' => 1500000,
            'is_savings' => false,
        ]);

        Subcategory::create([
            'category_id' => $cat1->id,
            'name' => 'Makan Siang',
            'budget_amount' => 1000000,
        ]);

        // 2. Akses bulan baru (2026-09) yang belum memiliki data
        $newMonth = '2026-09';
        $response = $this->getJson("/api/sync?month={$newMonth}");

        $response->assertStatus(200);
        $data = $response->json();

        // Verifikasi bulan baru kosong (total budget 0 dan kategori kosong)
        $this->assertEquals($newMonth, $data['budget']['month']);
        $this->assertEquals(0, $data['budget']['totalBudget']);
        $this->assertEquals(0, $data['budget']['totalCash']);
        $this->assertEmpty($data['budget']['categories']);

        // Data bulan lalu tetap tersimpan di database
        $this->assertDatabaseHas('budgets', [
            'month' => $prevMonth,
            'total_budget' => 5000000,
            'total_cash' => 1000000,
        ]);
    }

    public function test_can_copy_categories_from_previous_month(): void
    {
        // 1. Buat data kategori di bulan lalu (2026-08)
        $prevBudget = Budget::create([
            'month' => '2026-08',
            'total_budget' => 3000000,
            'total_cash' => 500000,
        ]);

        $cat = Category::create([
            'budget_id' => $prevBudget->id,
            'name' => 'Transportasi',
            'budget_amount' => 800000,
            'is_savings' => false,
        ]);

        Subcategory::create([
            'category_id' => $cat->id,
            'name' => 'Bensin & Tol',
            'budget_amount' => 500000,
        ]);

        // 2. Panggil endpoint copy-previous untuk bulan 2026-09
        $response = $this->postJson('/api/categories/copy-previous', [
            'month' => '2026-09',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'source_month' => '2026-08',
            ])
            ->assertJsonFragment([
                'name' => 'Transportasi',
                'budget' => 800000,
            ]);

        // Verifikasi bahwa kategori baru dibuat untuk budget 2026-09
        $newBudget = Budget::where('month', '2026-09')->first();
        $this->assertNotNull($newBudget);
        $this->assertDatabaseHas('categories', [
            'budget_id' => $newBudget->id,
            'name' => 'Transportasi',
            'budget_amount' => 800000,
        ]);
    }
}
