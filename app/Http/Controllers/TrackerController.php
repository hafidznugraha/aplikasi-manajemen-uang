<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TrackerController extends Controller
{
    public function index()
    {
        $month = now()->format('Y-m');

        $budget = Budget::with(['categories.subcategories'])->firstOrCreate(
            ['month' => $month],
            ['total_budget' => 0]
        );

        $transactions = Transaction::where('budget_id', $budget->id)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $initialData = [
            'budget' => [
                'id' => (string) $budget->id,
                'month' => $budget->month,
                'totalBudget' => (int) $budget->total_budget,
                'categories' => $budget->categories->map(function ($cat) {
                    return [
                        'id' => (string) $cat->id,
                        'name' => $cat->name,
                        'budget' => (int) $cat->budget_amount,
                        'subcategories' => $cat->subcategories->map(function ($sub) {
                            return [
                                'id' => (string) $sub->id,
                                'name' => $sub->name,
                                'budget' => (int) $sub->budget_amount,
                            ];
                        })->values()->all(),
                    ];
                })->values()->all(),
            ],
            'transactions' => $transactions->map(function ($t) {
                return [
                    'id' => (string) $t->id,
                    'date' => $t->date->format('Y-m-d'),
                    'categoryId' => (string) $t->category_id,
                    'subcategoryId' => $t->subcategory_id ? (string) $t->subcategory_id : null,
                    'description' => $t->description,
                    'amount' => (int) $t->amount,
                    'hasReceipt' => !empty($t->receipt_url),
                    'receiptUrl' => $t->receipt_url,
                    'createdAt' => $t->created_at->toISOString(),
                ];
            })->values()->all(),
        ];

        return view('tracker', compact('initialData'));
    }
}
