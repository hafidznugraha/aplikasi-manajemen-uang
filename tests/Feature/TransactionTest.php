<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionTest extends TestCase
{
    use RefreshDatabase;
    public function test_can_create_transfer_transaction(): void
    {
        $payload = [
            'type' => 'transfer',
            'fund_source' => 'bank',
            'fund_destination' => 'cash',
            'date' => now()->format('Y-m-d'),
            'description' => 'Tarik Tunai ATM BCA',
            'amount' => 100000,
        ];

        $response = $this->postJson('/api/transactions', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'type' => 'transfer',
                'fund_source' => 'bank',
                'fund_destination' => 'cash',
                'amount' => 100000,
            ]);

        $this->assertDatabaseHas('transactions', [
            'type' => 'transfer',
            'fund_source' => 'bank',
            'fund_destination' => 'cash',
            'amount' => 100000,
        ]);
    }

    public function test_can_fetch_sync_data_with_transfer_transaction(): void
    {
        $month = now()->format('Y-m');
        $response = $this->getJson("/api/sync?month={$month}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'budget',
                'transactions',
                'archives'
            ]);
    }
}
