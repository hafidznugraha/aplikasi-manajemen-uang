<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TrackerController extends Controller
{
    /**
     * Tampilkan halaman Tracker Pengeluaran (Instant Load)
     */
    public function index()
    {
        return view('tracker');
    }
}
