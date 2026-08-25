<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BudgetKu - Arsip Bulanan</title>
  
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <!-- Google Fonts: Inter -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Custom CSS -->
  <link href="{{ asset('css/style.css') }}" rel="stylesheet">

  <!-- Supabase Meta & Realtime Library -->
  <meta name="supabase-url" content="{{ env('SUPABASE_URL') }}">
  <meta name="supabase-key" content="{{ env('SUPABASE_KEY') }}">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  
  <!-- Auth JS (Route Guard) -->
  <script src="{{ asset('js/auth.js') }}"></script>
</head>
<body class="bg-light">

@include('partials.navbar')

<main class="container-fluid px-4 px-md-5 pt-3 pb-5">
  <!-- Page Loader -->
  @include('partials.loader')

  <!-- Main Content Container (Hidden initially with d-none) -->
  <div id="main-content" class="d-none">
    <div class="page-header mb-4 d-flex justify-content-between align-items-center">
      <h1 class="h3 mb-0">Arsip Bulanan</h1>
    </div>

  <div id="archive-empty-state" class="empty-state text-center py-5 d-none">
    <i class="bi bi-archive text-muted mb-3" style="font-size: 3rem;"></i>
    <h5 class="text-muted">Belum ada data arsip.</h5>
    <p class="text-muted">Data bulan sebelumnya akan otomatis tersimpan di sini.</p>
  </div>

  <div id="archive-cards-container" class="row g-3 mb-4">
    <!-- Archive cards injected here -->
  </div>

  <div id="archive-detail-section" class="d-none">
    <hr class="my-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="h5 mb-0" id="detail-month-title">Detail: </h3>
      <div class="action-buttons">
        <button id="btn-export-csv" class="btn btn-sm btn-outline-primary"><i class="bi bi-download"></i> Ekspor CSV</button>
        <button id="btn-close-detail" class="btn btn-sm btn-outline-secondary"><i class="bi bi-x"></i> Tutup</button>
      </div>
    </div>

    <!-- 3 Summary Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card card-budgetku summary-card card-budget h-100">
          <div class="card-body">
            <h6 class="card-title text-muted">Total Anggaran</h6>
            <h3 class="card-text mb-0" id="detail-total-budget">Rp 0</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card card-budgetku summary-card card-spent h-100">
          <div class="card-body">
            <h6 class="card-title text-muted">Total Pengeluaran</h6>
            <h3 class="card-text mb-0" id="detail-total-spent">Rp 0</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card card-budgetku summary-card card-remaining h-100" id="detail-remaining-card">
          <div class="card-body">
            <h6 class="card-title text-muted">Sisa Anggaran</h6>
            <h3 class="card-text mb-0" id="detail-total-remaining">Rp 0</h3>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <!-- Pie Chart -->
      <div class="col-md-6">
        <div class="card card-budgetku h-100">
          <div class="card-body">
            <h5 class="card-title mb-4">Alokasi Anggaran</h5>
            <div style="position: relative; height:250px; width:100%">
              <canvas id="archive-budget-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Progress Bars -->
      <div class="col-md-6">
        <div class="card card-budgetku h-100">
          <div class="card-body">
            <h5 class="card-title mb-4">Pengeluaran per Kategori</h5>
            <div id="archive-category-progress-container">
              <!-- Progress bars injected here -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions -->
    <div class="card card-budgetku">
      <div class="card-body">
        <h5 class="card-title mb-3">Transaksi Bulanan</h5>
        <div class="table-responsive">
          <table class="table table-hover table-transactions align-middle">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th class="text-end">Jumlah</th>
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
