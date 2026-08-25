<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/dashboard');
        $response->assertStatus(200);
        $response->assertSee('BudgetKu');
        $response->assertSee('active');

        $this->get('/budget')->assertStatus(200)->assertSee('BudgetKu');
        $this->get('/tracker')->assertStatus(200)->assertSee('BudgetKu');
        $this->get('/arsip')->assertStatus(200)->assertSee('BudgetKu');
        $this->get('/profile')->assertStatus(200)->assertSee('BudgetKu');
    }
}
