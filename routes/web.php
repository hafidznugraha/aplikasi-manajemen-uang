<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TrackerController;
use App\Http\Controllers\ApiController;

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

// Route Halaman Profil & Autentikasi
Route::view('/profile', 'profile')->name('profile.index');
Route::view('/login', 'login')->name('login');
Route::post('/login', [ApiController::class, 'login']);
Route::view('/register', 'register')->name('register');
Route::post('/register', [ApiController::class, 'register']);
Route::view('/forgot-password', 'forgot-password')->name('password.request');
Route::post('/forgot-password', [ApiController::class, 'forgotPassword']);
Route::view('/reset-password', 'reset-password')->name('password.reset');
Route::post('/reset-password', [ApiController::class, 'resetPassword']);

// Supabase REST API Endpoints
Route::prefix('api')->group(function () {
    Route::get('/sync', [ApiController::class, 'getSyncData'])->name('api.sync');
    Route::get('/budget', [ApiController::class, 'getBudget'])->name('api.budget.get');
    Route::post('/budget', [ApiController::class, 'updateTotalBudget'])->name('api.budget.update');

    Route::post('/categories', [ApiController::class, 'addCategory'])->name('api.categories.store');
    Route::put('/categories/{id}', [ApiController::class, 'updateCategory'])->name('api.categories.update');
    Route::delete('/categories/{id}', [ApiController::class, 'deleteCategory'])->name('api.categories.destroy');

    Route::get('/transactions', [ApiController::class, 'getTransactions'])->name('api.transactions.index');
    Route::post('/transactions', [ApiController::class, 'addTransaction'])->name('api.transactions.store');
    Route::put('/transactions/{id}', [ApiController::class, 'updateTransaction'])->name('api.transactions.update');
    Route::delete('/transactions/{id}', [ApiController::class, 'deleteTransaction'])->name('api.transactions.destroy');

    Route::post('/register', [ApiController::class, 'register'])->name('api.register');
    Route::post('/login', [ApiController::class, 'login'])->name('api.login');
    Route::post('/auth/register', [ApiController::class, 'register'])->name('api.auth.register');
    Route::post('/auth/login', [ApiController::class, 'login'])->name('api.auth.login');

    // Email OTP Verification Routes
    Route::post('/auth/send-otp', [ApiController::class, 'sendOtp'])->name('api.auth.send_otp');
    Route::post('/auth/verify-otp', [ApiController::class, 'verifyOtp'])->name('api.auth.verify_otp');
    Route::post('/auth/resend-otp', [ApiController::class, 'resendOtp'])->name('api.auth.resend_otp');

    // User Profile & Password Recovery Routes
    Route::post('/auth/update-password', [ApiController::class, 'updatePassword'])->name('api.auth.update_password');
    Route::post('/auth/forgot-password', [ApiController::class, 'forgotPassword'])->name('api.auth.forgot_password');
    Route::post('/auth/reset-password', [ApiController::class, 'resetPassword'])->name('api.auth.reset_password');
});
