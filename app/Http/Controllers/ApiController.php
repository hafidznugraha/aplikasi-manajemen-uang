<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\Transaction;
use App\Services\SupabaseStorageService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiController extends Controller
{
    protected SupabaseStorageService $storageService;

    public function __construct(SupabaseStorageService $storageService)
    {
        $this->storageService = $storageService;
    }

    /**
     * Endpoint terpadu untuk sinkronisasi kilat seluruh data aplikasi dalam 1 request
     */
    public function getSyncData(Request $request): JsonResponse
    {
        $month = $request->query('month', now()->format('Y-m'));

        $budget = Budget::with(['categories.subcategories'])
            ->firstOrCreate(
                ['month' => $month],
                ['total_budget' => 0]
            );

        $transactions = Transaction::where('budget_id', $budget->id)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $archives = Budget::with(['categories.subcategories', 'transactions'])
            ->where('month', '!=', $month)
            ->orderBy('month', 'desc')
            ->limit(6)
            ->get();

        return response()->json([
            'budget' => [
                'id' => (string) $budget->id,
                'month' => $budget->month,
                'totalBudget' => (int) $budget->total_budget,
                'categories' => $budget->categories->map(function ($cat) {
                    return [
                        'id' => (string) $cat->id,
                        'name' => $cat->name,
                        'budget' => (int) $cat->budget_amount,
                        'isSavings' => (bool) $cat->is_savings,
                        'is_savings' => (bool) $cat->is_savings,
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
                    'type' => $t->type ?? 'expense',
                    'is_system' => (bool) $t->is_system,
                    'isSystem' => (bool) $t->is_system,
                    'date' => $t->date->format('Y-m-d'),
                    'categoryId' => $t->category_id ? (string) $t->category_id : null,
                    'subcategoryId' => $t->subcategory_id ? (string) $t->subcategory_id : null,
                    'description' => $t->description,
                    'amount' => (int) $t->amount,
                    'hasReceipt' => !empty($t->receipt_url),
                    'receiptUrl' => $t->receipt_url,
                    'createdAt' => $t->created_at->toISOString(),
                ];
            })->values()->all(),
            'archives' => $archives->map(function ($b) {
                return [
                    'month' => $b->month,
                    'totalBudget' => (int) $b->total_budget,
                    'totalSpent' => (int) $b->transactions->where('type', 'expense')->sum('amount'),
                    'totalIncome' => (int) $b->transactions->where('type', 'income')->sum('amount'),
                    'archivedAt' => $b->updated_at->toISOString(),
                    'categories' => $b->categories->map(function ($cat) {
                        return [
                            'id' => (string) $cat->id,
                            'name' => $cat->name,
                            'budget' => (int) $cat->budget_amount,
                            'isSavings' => (bool) $cat->is_savings,
                            'is_savings' => (bool) $cat->is_savings,
                            'subcategories' => $cat->subcategories->map(function ($sub) {
                                return [
                                    'id' => (string) $sub->id,
                                    'name' => $sub->name,
                                    'budget' => (int) $sub->budget_amount,
                                ];
                            })->values()->all(),
                        ];
                    })->values()->all(),
                    'transactions' => $b->transactions->map(function ($t) {
                        return [
                            'id' => (string) $t->id,
                            'type' => $t->type ?? 'expense',
                            'is_system' => (bool) $t->is_system,
                            'isSystem' => (bool) $t->is_system,
                            'date' => $t->date->format('Y-m-d'),
                            'categoryId' => $t->category_id ? (string) $t->category_id : null,
                            'subcategoryId' => $t->subcategory_id ? (string) $t->subcategory_id : null,
                            'description' => $t->description,
                            'amount' => (int) $t->amount,
                            'hasReceipt' => !empty($t->receipt_url),
                            'receiptUrl' => $t->receipt_url,
                        ];
                    })->values()->all(),
                ];
            })->values()->all(),
        ]);
    }

    /**
     * Dapatkan budget aktif untuk bulan tertentu (default: bulan ini)
     */
    public function getBudget(Request $request): JsonResponse
    {
        $month = $request->query('month', now()->format('Y-m'));

        $budget = Budget::with(['categories.subcategories'])
            ->firstOrCreate(
                ['month' => $month],
                ['total_budget' => 0]
            );

        $categoriesFormatted = $budget->categories->map(function ($cat) {
            return [
                'id' => (string) $cat->id,
                'name' => $cat->name,
                'budget' => (int) $cat->budget_amount,
                'isSavings' => (bool) $cat->is_savings,
                'is_savings' => (bool) $cat->is_savings,
                'subcategories' => $cat->subcategories->map(function ($sub) {
                    return [
                        'id' => (string) $sub->id,
                        'name' => $sub->name,
                        'budget' => (int) $sub->budget_amount,
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        return response()->json([
            'id' => (string) $budget->id,
            'month' => $budget->month,
            'totalBudget' => (int) $budget->total_budget,
            'categories' => $categoriesFormatted,
        ]);
    }

    /**
     * Update total budget bulanan
     */
    public function updateTotalBudget(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
        ]);

        $month = $request->input('month', now()->format('Y-m'));
        $amount = (int) $request->input('amount');

        $budget = Budget::updateOrCreate(
            ['month' => $month],
            ['total_budget' => $amount]
        );

        return response()->json([
            'success' => true,
            'totalBudget' => (int) $budget->total_budget,
            'month' => $budget->month,
        ]);
    }

    /**
     * Tambah kategori baru ke Supabase
     */
    public function addCategory(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'budget' => 'required|numeric|min:0',
            'subcategories' => 'nullable|array',
            'month' => 'nullable|string',
        ]);

        $month = $request->input('month', now()->format('Y-m'));
        $budget = Budget::firstOrCreate(
            ['month' => $month],
            ['total_budget' => 0]
        );

        $isSavings = filter_var($request->input('is_savings', $request->input('isSavings', false)), FILTER_VALIDATE_BOOLEAN);

        $category = Category::create([
            'budget_id' => $budget->id,
            'name' => $request->input('name'),
            'budget_amount' => (int) $request->input('budget', 0),
            'is_savings' => $isSavings,
        ]);

        $subcategoriesData = $request->input('subcategories', []);
        $createdSubcats = [];

        if (is_array($subcategoriesData)) {
            foreach ($subcategoriesData as $sub) {
                if (!empty($sub['name'])) {
                    $subcat = Subcategory::create([
                        'category_id' => $category->id,
                        'name' => $sub['name'],
                        'budget_amount' => (int) ($sub['budget'] ?? 0),
                    ]);
                    $createdSubcats[] = [
                        'id' => (string) $subcat->id,
                        'name' => $subcat->name,
                        'budget' => (int) $subcat->budget_amount,
                    ];
                }
            }
        }

        return response()->json([
            'id' => (string) $category->id,
            'name' => $category->name,
            'budget' => (int) $category->budget_amount,
            'isSavings' => (bool) $category->is_savings,
            'is_savings' => (bool) $category->is_savings,
            'subcategories' => $createdSubcats,
        ], 201);
    }

    /**
     * Update kategori di Supabase
     */
    public function updateCategory(Request $request, $id): JsonResponse
    {
        $category = Category::with('subcategories')->findOrFail($id);

        if ($request->has('name')) {
            $category->name = $request->input('name');
        }

        if ($request->has('budget')) {
            $category->budget_amount = (int) $request->input('budget');
        }

        if ($request->has('is_savings') || $request->has('isSavings')) {
            $category->is_savings = filter_var($request->input('is_savings', $request->input('isSavings')), FILTER_VALIDATE_BOOLEAN);
        }

        $category->save();

        if ($request->has('subcategories') && is_array($request->input('subcategories'))) {
            $inputSubs = $request->input('subcategories');
            $keepIds = [];

            foreach ($inputSubs as $sub) {
                if (!empty($sub['name'])) {
                    if (!empty($sub['id']) && $existingSub = Subcategory::where('category_id', $category->id)->where('id', $sub['id'])->first()) {
                        $existingSub->name = $sub['name'];
                        $existingSub->budget_amount = (int) ($sub['budget'] ?? 0);
                        $existingSub->save();
                        $keepIds[] = $existingSub->id;
                    } else {
                        $newSub = Subcategory::create([
                            'category_id' => $category->id,
                            'name' => $sub['name'],
                            'budget_amount' => (int) ($sub['budget'] ?? 0),
                        ]);
                        $keepIds[] = $newSub->id;
                    }
                }
            }

            // Hapus subkategori yang memang sudah dihapus oleh user
            $category->subcategories()->whereNotIn('id', $keepIds)->delete();
        }

        $category->load('subcategories');

        return response()->json([
            'id' => (string) $category->id,
            'name' => $category->name,
            'budget' => (int) $category->budget_amount,
            'isSavings' => (bool) $category->is_savings,
            'is_savings' => (bool) $category->is_savings,
            'subcategories' => $category->subcategories->map(function ($s) {
                return [
                    'id' => (string) $s->id,
                    'name' => $s->name,
                    'budget' => (int) $s->budget_amount,
                ];
            })->values()->all(),
        ]);
    }

    /**
     * Hapus kategori dari Supabase
     */
    public function deleteCategory($id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Ambil seluruh transaksi bulan berjalan dari Supabase
     */
    public function getTransactions(Request $request): JsonResponse
    {
        $month = $request->query('month', now()->format('Y-m'));
        $budget = Budget::where('month', $month)->first();

        if (!$budget) {
            return response()->json([]);
        }

        $transactions = Transaction::where('budget_id', $budget->id)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $formatted = $transactions->map(function ($t) {
            return [
                'id' => (string) $t->id,
                'type' => $t->type ?? 'expense',
                'is_system' => (bool) $t->is_system,
                'isSystem' => (bool) $t->is_system,
                'date' => $t->date->format('Y-m-d'),
                'categoryId' => $t->category_id ? (string) $t->category_id : null,
                'subcategoryId' => $t->subcategory_id ? (string) $t->subcategory_id : null,
                'description' => $t->description,
                'amount' => (int) $t->amount,
                'hasReceipt' => !empty($t->receipt_url),
                'receiptUrl' => $t->receipt_url,
                'createdAt' => $t->created_at->toISOString(),
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Simpan transaksi baru & upload struk ke Supabase Storage
     */
    public function addTransaction(Request $request): JsonResponse
    {
        $type = $request->input('type', 'expense');

        $rules = [
            'date' => 'required|date',
            'type' => 'nullable|string|in:expense,income,reallocation',
            'is_system' => 'nullable|boolean',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'receipt_data' => 'nullable|string', // Base64 data jika dikirim via payload
            'month' => 'nullable|string',
        ];

        if ($type === 'income' || $type === 'reallocation') {
            $rules['category_id'] = 'nullable';
        } else {
            $rules['category_id'] = 'required|exists:categories,id';
        }

        $request->validate($rules);

        $month = $request->input('month', Carbon::parse($request->input('date'))->format('Y-m'));
        $budget = Budget::firstOrCreate(
            ['month' => $month],
            ['total_budget' => 0]
        );

        $receiptUrl = null;

        if ($request->hasFile('receipt')) {
            $receiptUrl = $this->storageService->uploadReceipt($request->file('receipt'));
        } elseif ($request->filled('receipt_data')) {
            $receiptUrl = $this->storageService->uploadReceipt($request->input('receipt_data'));
        }

        $isSystem = filter_var($request->input('is_system', $request->input('isSystem', false)), FILTER_VALIDATE_BOOLEAN);

        $transaction = Transaction::create([
            'budget_id' => $budget->id,
            'type' => $type,
            'is_system' => $isSystem,
            'category_id' => in_array($type, ['income', 'reallocation']) ? ($request->input('category_id') ?: null) : $request->input('category_id'),
            'subcategory_id' => $request->input('subcategory_id'),
            'date' => $request->input('date'),
            'description' => $request->input('description'),
            'amount' => (int) $request->input('amount'),
            'receipt_url' => $receiptUrl,
        ]);

        return response()->json([
            'id' => (string) $transaction->id,
            'type' => $transaction->type ?? 'expense',
            'is_system' => (bool) $transaction->is_system,
            'isSystem' => (bool) $transaction->is_system,
            'date' => $transaction->date->format('Y-m-d'),
            'categoryId' => $transaction->category_id ? (string) $transaction->category_id : null,
            'subcategoryId' => $transaction->subcategory_id ? (string) $transaction->subcategory_id : null,
            'description' => $transaction->description,
            'amount' => (int) $transaction->amount,
            'hasReceipt' => !empty($transaction->receipt_url),
            'receiptUrl' => $transaction->receipt_url,
            'createdAt' => $transaction->created_at->toISOString(),
        ], 201);
    }

    /**
     * Update transaksi di Supabase
     */
    public function updateTransaction(Request $request, $id): JsonResponse
    {
        $transaction = Transaction::findOrFail($id);

        if ($transaction->is_system) {
            return response()->json(['message' => 'Transaksi sistem tidak dapat diubah.'], 403);
        }

        $request->validate([
            'date' => 'sometimes|required|date',
            'type' => 'nullable|string|in:expense,income,reallocation',
            'category_id' => 'nullable',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'description' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:1',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'receipt_data' => 'nullable|string',
        ]);

        if ($request->has('type')) $transaction->type = $request->input('type');
        if ($request->has('date')) $transaction->date = $request->input('date');
        if ($request->has('category_id')) $transaction->category_id = $request->input('category_id') ?: null;
        if ($request->has('subcategory_id')) $transaction->subcategory_id = $request->input('subcategory_id') ?: null;
        if ($request->has('description')) $transaction->description = $request->input('description');
        if ($request->has('amount')) $transaction->amount = (int) $request->input('amount');

        if ($request->hasFile('receipt')) {
            if ($transaction->receipt_url) {
                $this->storageService->deleteReceipt($transaction->receipt_url);
            }
            $transaction->receipt_url = $this->storageService->uploadReceipt($request->file('receipt'));
        } elseif ($request->filled('receipt_data')) {
            if ($transaction->receipt_url) {
                $this->storageService->deleteReceipt($transaction->receipt_url);
            }
            $transaction->receipt_url = $this->storageService->uploadReceipt($request->input('receipt_data'));
        }

        $transaction->save();

        return response()->json([
            'id' => (string) $transaction->id,
            'type' => $transaction->type ?? 'expense',
            'is_system' => (bool) $transaction->is_system,
            'isSystem' => (bool) $transaction->is_system,
            'date' => $transaction->date->format('Y-m-d'),
            'categoryId' => $transaction->category_id ? (string) $transaction->category_id : null,
            'subcategoryId' => $transaction->subcategory_id ? (string) $transaction->subcategory_id : null,
            'description' => $transaction->description,
            'amount' => (int) $transaction->amount,
            'hasReceipt' => !empty($transaction->receipt_url),
            'receiptUrl' => $transaction->receipt_url,
            'createdAt' => $transaction->created_at->toISOString(),
        ]);
    }

    /**
     * Hapus transaksi & hapus struk dari Supabase Storage
     */
    public function deleteTransaction($id): JsonResponse
    {
        $transaction = Transaction::findOrFail($id);

        if ($transaction->is_system) {
            return response()->json(['message' => 'Transaksi sistem tidak dapat dihapus.'], 403);
        }

        if ($transaction->receipt_url) {
            $this->storageService->deleteReceipt($transaction->receipt_url);
        }

        $transaction->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Ambil riwayat arsip bulan-bulan lampau dari Supabase
     */
    public function getArchive(): JsonResponse
    {
        $currentMonth = now()->format('Y-m');

        $budgets = Budget::with(['categories.subcategories', 'transactions'])
            ->where('month', '!=', $currentMonth)
            ->orderBy('month', 'desc')
            ->get();

        $archive = $budgets->map(function ($b) {
            $totalSpent = (int) $b->transactions->sum('amount');

            return [
                'month' => $b->month,
                'totalBudget' => (int) $b->total_budget,
                'totalSpent' => $totalSpent,
                'archivedAt' => $b->updated_at->toISOString(),
                'categories' => $b->categories->map(function ($cat) {
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
                'transactions' => $b->transactions->map(function ($t) {
                    return [
                        'id' => (string) $t->id,
                        'date' => $t->date->format('Y-m-d'),
                        'categoryId' => (string) $t->category_id,
                        'subcategoryId' => $t->subcategory_id ? (string) $t->subcategory_id : null,
                        'description' => $t->description,
                        'amount' => (int) $t->amount,
                        'hasReceipt' => !empty($t->receipt_url),
                        'receiptUrl' => $t->receipt_url,
                    ];
                })->values()->all(),
            ];
        });

        return response()->json($archive);
    }
}
