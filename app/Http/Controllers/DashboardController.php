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
     * Tampilkan halaman Setup Budget (Instant Load)
     */
    public function budget()
    {
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
