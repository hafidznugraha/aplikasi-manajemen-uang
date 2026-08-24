<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TrackerController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Redirect root ke dashboard
Route::redirect('/', '/dashboard');

// Route Dashboard & Setup Budget
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
Route::get('/budget', [DashboardController::class, 'budget'])->name('budget.index');
Route::get('/arsip', [DashboardController::class, 'arsip'])->name('arsip.index');

// Route Tracker Harian
Route::get('/tracker', [TrackerController::class, 'index'])->name('tracker.index');

// Supabase REST API Endpoints
use App\Http\Controllers\ApiController;

Route::prefix('api')->group(function () {
    Route::get('/budget', [ApiController::class, 'getBudget'])->name('api.budget.get');
    Route::post('/budget', [ApiController::class, 'updateTotalBudget'])->name('api.budget.update');

    Route::post('/categories', [ApiController::class, 'addCategory'])->name('api.categories.store');
    Route::put('/categories/{id}', [ApiController::class, 'updateCategory'])->name('api.categories.update');
    Route::delete('/categories/{id}', [ApiController::class, 'deleteCategory'])->name('api.categories.destroy');

    Route::get('/transactions', [ApiController::class, 'getTransactions'])->name('api.transactions.index');
    Route::post('/transactions', [ApiController::class, 'addTransaction'])->name('api.transactions.store');
    Route::put('/transactions/{id}', [ApiController::class, 'updateTransaction'])->name('api.transactions.update');
    Route::delete('/transactions/{id}', [ApiController::class, 'deleteTransaction'])->name('api.transactions.destroy');

    Route::get('/archive', [ApiController::class, 'getArchive'])->name('api.archive.index');
});
