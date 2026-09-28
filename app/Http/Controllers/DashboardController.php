<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Tampilkan halaman Dashboard (Instant Load)
     */
    public function index()
    {
        return view('index');
    }

    /**
     * Tampilkan halaman Setup Budget (Instant Load) atau kembalikan JSON jika dipanggil via API
     */
    public function budget(Request $request)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return app(ApiController::class)->getBudget($request);
        }
        return view('budget');
    }

    /**
     * Tampilkan halaman Arsip (Instant Load)
     */
    public function arsip()
    {
        return view('arsip');
    }
}
