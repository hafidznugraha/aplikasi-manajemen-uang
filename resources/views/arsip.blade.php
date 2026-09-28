<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Arsip Bulanan - BudgetKu</title>
  
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <!-- Google Fonts: Inter -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Custom CSS -->
  <link href="{{ asset('css/style.css') }}" rel="stylesheet">

  <!-- Supabase Meta & Realtime Library -->
  <meta name="supabase-url" content="{{ config('services.supabase.url') ?: env('SUPABASE_URL', 'https://dmhifcfsloncgjrxzvnl.supabase.co') }}">
  <meta name="supabase-key" content="{{ config('services.supabase.key') ?: env('SUPABASE_KEY', 'sb_publishable_0UVfI5vLmCrS4Oilr0rDMg_5YQtQsQl') }}">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  
  <!-- Auth JS (Route Guard) -->
  <script src="{{ asset('js/auth.js') }}"></script>
</head>
<body>

@include('partials.navbar')

<main class="container-fluid px-3 px-md-5 pt-3 pb-5">
  <!-- Page Loader -->
  @include('partials.loader')

  <!-- Main Content Container (Hidden initially with d-none) -->
  <div id="main-content" class="d-none">
    <div class="page-header mb-4 d-flex justify-content-between align-items-center">
      <div>
        <h1 class="h3 mb-1 fw-bold">Arsip Bulanan</h1>
        <p class="text-secondary small mb-0">Riwayat dan evaluasi performa anggaran bulan-bulan sebelumnya</p>
      </div>
    </div>

    <!-- Empty State -->
    <div id="archive-empty-state" class="empty-state text-center py-5 d-none">
      <i class="bi bi-archive text-secondary mb-3 d-block opacity-50" style="font-size: 3.5rem;"></i>
      <h5 class="fw-bold">Belum ada data arsip</h5>
      <p class="text-secondary small">Data bulan sebelumnya akan otomatis tersimpan di sini setelah pergantian bulan.</p>
    </div>

    <!-- Archive Month Cards Grid -->
    <div id="archive-cards-container" class="row g-3 mb-4">
      <!-- Archive cards injected here -->
    </div>

    <!-- Detail Section for Selected Archived Month -->
    <div id="archive-detail-section" class="d-none">
      <hr class="my-4" style="border-color: var(--bk-border);">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 class="h5 mb-0 fw-bold" id="detail-month-title">Detail Arsip: </h3>
        <div class="action-buttons d-flex gap-2">
          <button id="btn-export-csv" class="btn btn-sm btn-outline-secondary px-3"><i class="bi bi-download me-1"></i> Ekspor CSV</button>
          <button id="btn-close-detail" class="btn btn-sm btn-secondary px-3"><i class="bi bi-x me-1"></i> Tutup</button>
        </div>
      </div>

      <!-- 3 Summary Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card card-budgetku summary-card card-budget h-100 p-4">
            <h6 class="text-white text-opacity-75 mb-1 fw-medium small">Total Anggaran</h6>
            <h3 class="mb-0 text-white fw-bold text-rupiah" id="detail-total-budget">Rp 0</h3>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card card-budgetku summary-card card-spent h-100 p-4">
            <h6 class="text-white text-opacity-75 mb-1 fw-medium small">Total Pengeluaran</h6>
            <h3 class="mb-0 text-white fw-bold text-rupiah" id="detail-total-spent">Rp 0</h3>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card card-budgetku summary-card card-remaining h-100 p-4" id="detail-remaining-card">
            <h6 class="text-white text-opacity-75 mb-1 fw-medium small">Sisa Anggaran</h6>
            <h3 class="mb-0 text-white fw-bold text-rupiah" id="detail-total-remaining">Rp 0</h3>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <!-- Donut Chart -->
        <div class="col-md-6">
          <div class="card card-budgetku h-100 p-4">
            <h5 class="card-title fw-bold mb-3">Alokasi Anggaran</h5>
            <div style="position: relative; height:260px; width:100%">
              <canvas id="archive-budget-chart"></canvas>
            </div>
          </div>
        </div>
        
        <!-- Progress Bars -->
        <div class="col-md-6">
          <div class="card card-budgetku h-100 p-4">
            <h5 class="card-title fw-bold mb-3">Pengeluaran per Kategori</h5>
            <div id="archive-category-progress-container">
              <!-- Progress bars injected here -->
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Transactions Table -->
      <div class="card card-budgetku p-0 overflow-hidden">
        <div class="p-3 border-bottom" style="border-color: var(--bk-border);">
          <h5 class="card-title mb-0 fw-bold">Transaksi Bulanan</h5>
        </div>
        <div class="table-responsive">
          <table class="table table-hover table-transactions align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-4">Tanggal</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th class="text-end pe-4">Jumlah</th>
              </tr>
            </thead>
            <tbody id="archive-transactions-table-body">
              <!-- Transactions injected here -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</main>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<!-- Shared JS -->
<script src="{{ asset('js/supabase.js') }}"></script>
<script src="{{ asset('js/modal-alert.js') }}"></script>
<script src="{{ asset('js/format.js') }}"></script>
<script src="{{ asset('js/storage.js') }}"></script>
<!-- Page JS -->
<script src="{{ asset('js/arsip.js') }}"></script>
<script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
