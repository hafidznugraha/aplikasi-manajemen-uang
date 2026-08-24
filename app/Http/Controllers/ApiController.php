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

        $category = Category::create([
            'budget_id' => $budget->id,
            'name' => $request->input('name'),
            'budget_amount' => (int) $request->input('budget', 0),
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

        $category->save();

        if ($request->has('subcategories') && is_array($request->input('subcategories'))) {
            // Hapus subkategori lama dan buat ulang
            $category->subcategories()->delete();
            $newSubs = [];
            foreach ($request->input('subcategories') as $sub) {
                if (!empty($sub['name'])) {
                    $subcat = Subcategory::create([
                        'category_id' => $category->id,
                        'name' => $sub['name'],
                        'budget_amount' => (int) ($sub['budget'] ?? 0),
                    ]);
                    $newSubs[] = [
                        'id' => (string) $subcat->id,
                        'name' => $subcat->name,
                        'budget' => (int) $subcat->budget_amount,
                    ];
                }
            }
        }

        $category->load('subcategories');

        return response()->json([
            'id' => (string) $category->id,
            'name' => $category->name,
            'budget' => (int) $category->budget_amount,
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
                'date' => $t->date->format('Y-m-d'),
                'categoryId' => (string) $t->category_id,
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
        $request->validate([
            'date' => 'required|date',
            'category_id' => 'required|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'receipt_data' => 'nullable|string', // Base64 data jika dikirim via payload
            'month' => 'nullable|string',
        ]);

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

        $transaction = Transaction::create([
            'budget_id' => $budget->id,
            'category_id' => $request->input('category_id'),
            'subcategory_id' => $request->input('subcategory_id'),
            'date' => $request->input('date'),
            'description' => $request->input('description'),
            'amount' => (int) $request->input('amount'),
            'receipt_url' => $receiptUrl,
        ]);

        return response()->json([
            'id' => (string) $transaction->id,
            'date' => $transaction->date->format('Y-m-d'),
            'categoryId' => (string) $transaction->category_id,
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

        $request->validate([
            'date' => 'sometimes|required|date',
            'category_id' => 'sometimes|required|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'description' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:1',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'receipt_data' => 'nullable|string',
        ]);

        if ($request->has('date')) $transaction->date = $request->input('date');
        if ($request->has('category_id')) $transaction->category_id = $request->input('category_id');
        if ($request->has('subcategory_id')) $transaction->subcategory_id = $request->input('subcategory_id');
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
            'date' => $transaction->date->format('Y-m-d'),
            'categoryId' => (string) $transaction->category_id,
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
