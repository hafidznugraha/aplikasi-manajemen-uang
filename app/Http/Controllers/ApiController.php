<?php

namespace App\Http\Controllers;

use App\Mail\OtpVerificationMail;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\Transaction;
use App\Models\User;
use App\Services\SupabaseStorageService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class ApiController extends Controller
{
    protected SupabaseStorageService $storageService;

    public function __construct(SupabaseStorageService $storageService)
    {
        $this->storageService = $storageService;
    }

    /**
     * Dapatkan numeric user_id dari request jika ada
     */
    protected function getUserIdFromRequest(Request $request): ?int
    {
        $userId = $request->input('user_id', $request->query('user_id'));
        if ($userId && is_numeric($userId)) {
            return (int) $userId;
        }
        return null;
    }

    /**
     * Endpoint terpadu untuk sinkronisasi kilat seluruh data aplikasi dalam 1 request
     */
    public function getSyncData(Request $request): JsonResponse
    {
        $month = $request->query('month', now()->format('Y-m'));
        $userId = $this->getUserIdFromRequest($request);

        $budgetQuery = Budget::with(['categories.subcategories'])->where('month', $month);
        if ($userId !== null) {
            $budgetQuery->where('user_id', $userId);
        }
        $budget = $budgetQuery->first();

        if (!$budget) {
            $budget = new Budget([
                'month' => $month,
                'total_budget' => 0,
                'user_id' => $userId,
            ]);
            if ($userId !== null) {
                $budget->save();
            }
        }

        $txnQuery = Transaction::query();
        if ($budget->id) {
            $txnQuery->where('budget_id', $budget->id);
        } else {
            $txnQuery->whereRaw('1 = 0');
        }
        if ($userId !== null) {
            $txnQuery->where('user_id', $userId);
        }
        $transactions = $txnQuery->orderBy('date', 'desc')->orderBy('created_at', 'desc')->get();

        $archiveQuery = Budget::with(['categories.subcategories', 'transactions'])
            ->where('month', '!=', $month);
        if ($userId !== null) {
            $archiveQuery->where('user_id', $userId);
        }
        $archives = $archiveQuery->orderBy('month', 'desc')->limit(6)->get();

        return response()->json([
            'budget' => [
                'id' => (string) $budget->id,
                'month' => $budget->month,
                'totalBudget' => (int) $budget->total_budget,
                'totalCash' => (int) ($budget->total_cash ?? 0),
                'total_budget' => (int) $budget->total_budget,
                'total_cash' => (int) ($budget->total_cash ?? 0),
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
                    'fund_source' => $t->fund_source ?? 'bank',
                    'fundSource' => $t->fund_source ?? 'bank',
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
        $userId = $this->getUserIdFromRequest($request);

        $budgetQuery = Budget::with(['categories.subcategories'])->where('month', $month);
        if ($userId !== null) {
            $budgetQuery->where('user_id', $userId);
        }
        $budget = $budgetQuery->first();

        if (!$budget) {
            $budget = new Budget([
                'month' => $month,
                'total_budget' => 0,
                'user_id' => $userId,
            ]);
            if ($userId !== null) {
                $budget->save();
            }
        }

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
            'totalCash' => (int) ($budget->total_cash ?? 0),
            'total_budget' => (int) $budget->total_budget,
            'total_cash' => (int) ($budget->total_cash ?? 0),
            'categories' => $categoriesFormatted,
        ]);
    }

    /**
     * Update total budget bulanan (Bank & Tunai)
     */
    public function updateTotalBudget(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'nullable|string',
            'amount' => 'nullable|numeric|min:0',
            'total_budget' => 'nullable|numeric|min:0',
            'total_cash' => 'nullable|numeric|min:0',
        ]);

        $month = $request->input('month', now()->format('Y-m'));
        $amount = (int) $request->input('amount', $request->input('total_budget', 0));
        $cash = (int) $request->input('total_cash', 0);
        $userId = $this->getUserIdFromRequest($request);

        $match = ['month' => $month];
        if ($userId !== null) {
            $match['user_id'] = $userId;
        }

        $budget = Budget::updateOrCreate(
            $match,
            [
                'total_budget' => $amount,
                'total_cash' => $cash,
            ]
        );

        return response()->json([
            'success' => true,
            'totalBudget' => (int) $budget->total_budget,
            'totalCash' => (int) $budget->total_cash,
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
        $userId = $this->getUserIdFromRequest($request);

        $match = ['month' => $month];
        if ($userId !== null) {
            $match['user_id'] = $userId;
        }

        $budget = Budget::firstOrCreate(
            $match,
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
        $userId = $this->getUserIdFromRequest($request);

        $budgetQuery = Budget::where('month', $month);
        if ($userId !== null) {
            $budgetQuery->where('user_id', $userId);
        }
        $budget = $budgetQuery->first();

        if (!$budget) {
            return response()->json([]);
        }

        $txnQuery = Transaction::where('budget_id', $budget->id);
        if ($userId !== null) {
            $txnQuery->where('user_id', $userId);
        }
        $transactions = $txnQuery->orderBy('date', 'desc')
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
        $userId = $this->getUserIdFromRequest($request);

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
        $match = ['month' => $month];
        if ($userId !== null) {
            $match['user_id'] = $userId;
        }

        $budget = Budget::firstOrCreate(
            $match,
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
            'user_id' => $userId,
            'budget_id' => $budget->id,
            'type' => $type,
            'fund_source' => $request->input('fund_source', $request->input('fundSource', 'bank')),
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
            'fund_source' => $transaction->fund_source ?? 'bank',
            'fundSource' => $transaction->fund_source ?? 'bank',
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
            'fund_source' => 'nullable|string|in:bank,cash',
            'category_id' => 'nullable',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'description' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:1',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'receipt_data' => 'nullable|string',
        ]);

        if ($request->has('type')) $transaction->type = $request->input('type');
        if ($request->has('fund_source')) $transaction->fund_source = $request->input('fund_source');
        if ($request->has('fundSource')) $transaction->fund_source = $request->input('fundSource');
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
            'fund_source' => $transaction->fund_source ?? 'bank',
            'fundSource' => $transaction->fund_source ?? 'bank',
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

    /**
     * Kirim Kode OTP Verifikasi Pendaftaran ke Email Asli Pengguna
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:6',
        ]);

        $email = strtolower(trim($request->input('email')));
        $name = trim($request->input('name'));
        $password = $request->input('password');

        // 1. Cek apakah email sudah terdaftar di database Supabase
        if (User::where('email', $email)->exists()) {
            return response()->json([
                'message' => 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau langsung masuk ke akun Anda.'
            ], 422);
        }

        // 2. Generate 6-digit numeric OTP & simpan di Cache (10 menit)
        $otp = (string) random_int(100000, 999999);

        Cache::put("reg_otp_{$email}", [
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'otp' => $otp,
            'created_at' => now()->timestamp,
        ], now()->addMinutes(10));

        // 3. Kirim Email OTP Resmi ke Inbox Pengguna via Supabase Auth Mailer
        $supabaseUrl = config('services.supabase.url', env('SUPABASE_URL', 'https://dmhifcfsloncgjrxzvnl.supabase.co'));
        $anonKey = config('services.supabase.anon_key', env('SUPABASE_ANON_KEY', 'sb_publishable_0UVfI5vLmCrS4Oilr0rDMg_5YQtQsQl'));

        $emailSent = false;
        try {
            $ch = curl_init("{$supabaseUrl}/auth/v1/otp");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'apikey: ' . $anonKey,
                'Authorization: Bearer ' . $anonKey,
                'Content-Type: application/json',
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'email' => $email,
                'create_user' => true,
            ]));
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                $emailSent = true;
            }
        } catch (\Throwable $e) {
            \Log::error("Supabase Auth OTP delivery error: " . $e->getMessage());
        }

        // Juga coba kirim via Laravel Mail jika driver SMTP aktif
        try {
            Mail::to($email)->send(new OtpVerificationMail($name, $otp));
        } catch (\Throwable $e) {
            \Log::error("Laravel Mail OTP error: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "Kode OTP telah dikirimkan ke kotak masuk email {$email}.",
            'email' => $email,
        ]);
    }

    /**
     * Verifikasi Kode OTP dan Buat Akun Baru di Database Supabase
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|email',
            'otp' => 'required|string|min:6|max:8',
        ]);

        $email = strtolower(trim($request->input('email')));
        $otp = trim($request->input('otp'));

        $cached = Cache::get("reg_otp_{$email}");

        if (!$cached) {
            return response()->json([
                'message' => 'Kode OTP telah kadaluarsa atau tidak ditemukan. Silakan kirim ulang kode OTP.'
            ], 422);
        }

        $isValid = false;

        // 1. Verifikasi kecocokan dengan Cache lokal
        if ($cached['otp'] === $otp) {
            $isValid = true;
        } else {
            // 2. Verifikasi kecocokan dengan Supabase Auth OTP
            $supabaseUrl = config('services.supabase.url', env('SUPABASE_URL', 'https://dmhifcfsloncgjrxzvnl.supabase.co'));
            $anonKey = config('services.supabase.anon_key', env('SUPABASE_ANON_KEY', 'sb_publishable_0UVfI5vLmCrS4Oilr0rDMg_5YQtQsQl'));

            $ch = curl_init("{$supabaseUrl}/auth/v1/verify");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'apikey: ' . $anonKey,
                'Authorization: Bearer ' . $anonKey,
                'Content-Type: application/json',
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'type' => 'email',
                'email' => $email,
                'token' => $otp,
            ]));
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                $isValid = true;
            }
        }

        if (!$isValid) {
            return response()->json([
                'message' => 'Kode OTP yang Anda masukkan salah. Silakan periksa kembali email Anda.'
            ], 422);
        }

        // Cek duplikasi akun sebelum insert
        if (User::where('email', $email)->exists()) {
            Cache::forget("reg_otp_{$email}");
            return response()->json([
                'message' => 'Alamat email ini sudah terdaftar. Silakan langsung masuk ke akun Anda.'
            ], 422);
        }

        // Buat User di database Supabase (Password otomatis di-hash Bcrypt oleh model User)
        $user = User::create([
            'name' => $cached['name'],
            'email' => $email,
            'password' => $cached['password'],
        ]);

        Cache::forget("reg_otp_{$email}");

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran akun berhasil!',
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ], 201);
    }

    /**
     * Kirim Ulang Kode OTP ke Email dengan Jeda 60 Detik
     */
    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|email',
        ]);

        $email = strtolower(trim($request->input('email')));
        $cached = Cache::get("reg_otp_{$email}");

        if (!$cached) {
            return response()->json([
                'message' => 'Sesi pendaftaran telah berakhir. Silakan isi kembali formulir pendaftaran.'
            ], 422);
        }

        // Cek cooldown 60 detik
        if (isset($cached['last_sent_at']) && (now()->timestamp - $cached['last_sent_at']) < 60) {
            $remaining = 60 - (now()->timestamp - $cached['last_sent_at']);
            return response()->json([
                'message' => "Harap tunggu {$remaining} detik sebelum meminta kode baru."
            ], 429);
        }

        $otp = (string) random_int(100000, 999999);
        $cached['otp'] = $otp;
        $cached['last_sent_at'] = now()->timestamp;

        Cache::put("reg_otp_{$email}", $cached, now()->addMinutes(10));

        // Kirim via Supabase Auth
        $supabaseUrl = config('services.supabase.url', env('SUPABASE_URL', 'https://dmhifcfsloncgjrxzvnl.supabase.co'));
        $anonKey = config('services.supabase.anon_key', env('SUPABASE_ANON_KEY', 'sb_publishable_0UVfI5vLmCrS4Oilr0rDMg_5YQtQsQl'));

        try {
            $ch = curl_init("{$supabaseUrl}/auth/v1/otp");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'apikey: ' . $anonKey,
                'Authorization: Bearer ' . $anonKey,
                'Content-Type: application/json',
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'email' => $email,
                'create_user' => true,
            ]));
            curl_exec($ch);
            curl_close($ch);
        } catch (\Throwable $e) {
            \Log::error("Supabase resend OTP error: " . $e->getMessage());
        }

        try {
            Mail::to($email)->send(new OtpVerificationMail($cached['name'], $otp));
        } catch (\Throwable $e) {
            \Log::error("Laravel Mail resend error: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "Kode OTP baru telah dikirimkan ke kotak masuk email {$email}.",
        ]);
    }

    /**
     * Registrasi user baru langsung ke Supabase dengan kata sandi ter-hash (Bcrypt) - Fallback
     */
    public function register(Request $request): JsonResponse
    {
        return $this->sendOtp($request);
    }

    /**
     * Autentikasi user dari database Supabase dengan verifikasi Hash Bcrypt
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.'
            ], 401);
        }

        $isValid = false;
        if (Hash::check($password, $user->password)) {
            $isValid = true;
        } elseif ($user->password === $password) {
            // Re-hash jika sebelumnya masih plain text
            $user->password = $password;
            $user->save();
            $isValid = true;
        }

        if (!$isValid) {
            return response()->json([
                'message' => 'Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.'
            ], 401);
        }

        return response()->json([
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    }

    /**
     * Update kata sandi pengguna di database Supabase (Bcrypt)
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string|min:6',
            'user_id' => 'nullable',
            'email' => 'nullable|string|email',
        ]);

        $newPassword = $request->input('password');
        $userId = $this->getUserIdFromRequest($request);
        $email = strtolower(trim($request->input('email', '')));

        $user = null;
        if ($userId) {
            $user = User::find($userId);
        }
        if (!$user && $email) {
            $user = User::where('email', $email)->first();
        }

        if (!$user) {
            return response()->json([
                'message' => 'Pengguna tidak ditemukan atau sesi telah berakhir.'
            ], 404);
        }

        $user->password = $newPassword; // Model User automatically hashes it with Bcrypt
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui!',
        ]);
    }

    /**
     * Kirim email reset password via Supabase Auth
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|email',
        ]);

        $email = strtolower(trim($request->input('email')));

        // Kirim recovery request ke Supabase Auth
        $supabaseUrl = config('services.supabase.url', env('SUPABASE_URL', 'https://dmhifcfsloncgjrxzvnl.supabase.co'));
        $anonKey = config('services.supabase.anon_key', env('SUPABASE_ANON_KEY', 'sb_publishable_0UVfI5vLmCrS4Oilr0rDMg_5YQtQsQl'));

        try {
            $redirectUrl = urlencode('http://127.0.0.1:8000/reset-password.html');
            $ch = curl_init("{$supabaseUrl}/auth/v1/recover?redirect_to={$redirectUrl}");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'apikey: ' . $anonKey,
                'Authorization: Bearer ' . $anonKey,
                'Content-Type: application/json',
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'email' => $email,
            ]));
            curl_exec($ch);
            curl_close($ch);
        } catch (\Throwable $e) {
            \Log::error("Supabase Auth recover error: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Jika email terdaftar, tautan reset telah dikirim ke kotak masuk Anda.'
        ]);
    }

    /**
     * Reset kata sandi pengguna di tabel public.users
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string|min:6',
            'email' => 'nullable|string|email',
        ]);

        $newPassword = $request->input('password');
        $email = strtolower(trim($request->input('email', '')));

        if ($email) {
            $user = User::where('email', $email)->first();
            if ($user) {
                $user->password = $newPassword; // Otomatis Bcrypt
                $user->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui!'
        ]);
    }
}
