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

<!-- Shared Navbar -->
<nav class="navbar navbar-expand-md navbar-budgetku fixed-top">
  <div class="container-fluid px-4 px-md-5">
    <a class="navbar-brand" href="{{ route('dashboard.index') }}">
      <i class="bi bi-wallet2"></i> BudgetKu
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="mainNav">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link" href="{{ route('dashboard.index') }}"><i class="bi bi-speedometer2"></i> Dashboard</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="{{ route('budget.index') }}"><i class="bi bi-piggy-bank"></i> Budget</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="{{ route('tracker.index') }}"><i class="bi bi-journal-text"></i> Tracker</a>
        </li>
        <li class="nav-item">
          <a class="nav-link active" aria-current="page" href="{{ route('arsip.index') }}"><i class="bi bi-archive"></i> Arsip</a>
        </li>
      </ul>
      <div class="d-flex align-items-center gap-2 gap-md-3">
        <span class="month-selector" id="current-month-display">
          <i class="bi bi-calendar3"></i>
        </span>
        
        <!-- User Profile Dropdown & Logout -->
        <div class="dropdown" id="user-profile-dropdown">
          <button class="btn btn-light btn-sm rounded-pill d-flex align-items-center gap-2 px-3 py-1 border shadow-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle text-primary fs-5"></i>
            <span class="fw-semibold small text-dark d-none d-sm-inline" id="navbar-user-name">User</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2 p-2" style="min-width: 200px;">
            <li class="px-2 py-1 mb-1 border-bottom">
              <p class="small text-muted mb-0" style="font-size: 0.75rem;">Masuk sebagai:</p>
              <p class="fw-bold small text-dark mb-0 text-truncate" id="navbar-user-email">user@test.com</p>
            </li>
            <li>
              <a class="dropdown-item text-danger rounded-2 d-flex align-items-center gap-2 py-2" href="#" onclick="handleLogout(event)">
                <i class="bi bi-box-arrow-right"></i> Keluar
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</nav>

<main class="container-fluid px-4 px-md-5 pt-3 pb-5">
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
</main>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<!-- Shared JS -->
<script src="{{ asset('js/format.js') }}"></script>
<script src="{{ asset('js/storage.js') }}"></script>
<!-- Page JS -->
<script src="{{ asset('js/arsip.js') }}"></script>
<script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
