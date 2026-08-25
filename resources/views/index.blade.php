<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - BudgetKu</title>
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
      <!-- Setup Alert -->
      <div id="setup-alert" class="alert alert-warning d-none" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Budget bulan ini belum diatur. <a href="{{ route('budget.index') }}" class="alert-link">Atur budget sekarang</a>.
      </div>

      <!-- Empty State -->
      <div id="empty-state" class="empty-state text-center my-5 p-5 bg-white rounded shadow-sm d-none">
        <i class="bi bi-wallet2 display-1 text-muted"></i>
        <h3 class="mt-3">Selamat Datang di BudgetKu!</h3>
        <p class="text-muted">Mulai kelola keuangan Anda dengan membuat budget bulanan pertama.</p>
        <a href="{{ route('budget.index') }}" class="btn btn-primary mt-3"><i class="bi bi-plus-circle"></i> Buat Budget</a>
      </div>

      <div id="dashboard-content" class="d-none">
      <!-- 3 Summary Cards -->
      <div class="row g-3 mb-4">
        <!-- Card 1: Total Budget -->
        <div class="col-md-4">
          <div class="card card-budgetku summary-card card-budget text-white p-3 border-0 shadow-sm h-100 d-flex flex-column justify-content-center">
            <div class="d-flex justify-content-between align-items-center w-100">
              <div>
                <h6 class="text-white text-opacity-75 mb-1 fw-medium small">Total Budget</h6>
                <h4 class="mb-0 text-white fw-bold" id="total-budget">Rp 0</h4>
                <small class="text-white text-opacity-75 fw-medium d-none" id="total-budget-income-note">+ Rp 0 dari pemasukan</small>
              </div>
              <div class="icon-box bg-white bg-opacity-20 text-white p-3 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2" style="width: 52px; height: 52px;">
                <i class="bi bi-piggy-bank fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Total Pengeluaran -->
        <div class="col-md-4">
          <div class="card card-budgetku summary-card card-spent text-white p-3 border-0 shadow-sm h-100 d-flex flex-column justify-content-center">
            <div class="d-flex justify-content-between align-items-center w-100">
              <div>
                <h6 class="text-white text-opacity-75 mb-1 fw-medium small">Total Pengeluaran</h6>
                <h4 class="mb-0 text-white fw-bold" id="total-spent">Rp 0</h4>
              </div>
              <div class="icon-box bg-white bg-opacity-20 text-white p-3 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2" style="width: 52px; height: 52px;">
                <i class="bi bi-cart-dash fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3: Sisa Budget -->
        <div class="col-md-4">
          <div class="card card-budgetku summary-card card-remaining text-white p-3 border-0 shadow-sm h-100 d-flex flex-column justify-content-center" id="remaining-card">
            <div class="d-flex justify-content-between align-items-center w-100">
              <div>
                <h6 class="text-white text-opacity-75 mb-1 fw-medium small" id="remaining-card-label">Sisa Budget</h6>
                <h4 class="mb-0 text-white fw-bold" id="total-remaining">Rp 0</h4>
                <small class="text-white text-opacity-75 fw-medium d-block mt-1" id="remaining-breakdown-note">
                  Digital: <span id="sisa-digital" class="fw-semibold">Rp 0</span> | Fisik: <span id="sisa-fisik" class="fw-semibold">Rp 0</span>
                </small>
              </div>
              <div class="icon-box bg-white bg-opacity-20 text-white p-3 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2" style="width: 52px; height: 52px;">
                <i class="bi bi-wallet2 fs-4" id="remaining-card-icon"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Two-column section -->
      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card card-budgetku h-100 p-3">
            <h5 class="mb-3">Alokasi Budget per Kategori</h5>
            <div class="chart-container" style="position: relative; height:300px; width:100%">
              <canvas id="budgetChart"></canvas>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card card-budgetku h-100 p-3">
            <h5 class="mb-3">Progress Pengeluaran Kategori</h5>
            <div id="category-progress-container" class="overflow-auto" style="max-height: 300px;">
              <!-- Progress bars injected here -->
            </div>
          </div>
        </div>
      </div>

      <!-- 2 Line Charts: Tren Pengeluaran & Tren Pemasukan Harian -->
      <div class="row g-4 mb-4">
        <!-- Chart 1: Tren Pengeluaran Harian -->
        <div class="col-lg-6">
          <div class="card card-budgetku p-4 h-100">
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 class="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                  <i class="bi bi-graph-down text-primary"></i> Tren Pengeluaran Harian
                </h5>
                <p class="text-muted small mb-0">Pantau fluktuasi pengeluaran setiap hari</p>
              </div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="badge bg-light text-dark border px-2 py-1 rounded-2 small" id="daily-avg-badge">
                  <i class="bi bi-calculator me-1 text-muted"></i> Rata-rata: <strong id="daily-avg-val">Rp 0</strong>/hari
                </span>
                <span class="badge bg-light text-primary border border-primary-subtle px-2 py-1 rounded-2 small" id="daily-max-badge">
                  <i class="bi bi-arrow-up-right me-1"></i> Puncak: <strong id="daily-max-val">-</strong>
                </span>
              </div>
            </div>
            <div class="chart-container" style="position: relative; height: 260px; width: 100%;">
              <canvas id="dailyExpenseChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Chart 2: Tren Pemasukan Harian -->
        <div class="col-lg-6">
          <div class="card card-budgetku p-4 h-100">
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 class="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                  <i class="bi bi-graph-up-arrow text-success"></i> Tren Pemasukan Harian
                </h5>
                <p class="text-muted small mb-0">Pantau arus pemasukan tambahan setiap hari</p>
              </div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="badge bg-light text-dark border px-2 py-1 rounded-2 small" id="daily-income-avg-badge">
                  <i class="bi bi-calculator me-1 text-muted"></i> Rata-rata: <strong id="daily-income-avg-val">Rp 0</strong>/hari
                </span>
                <span class="badge bg-light text-success border border-success-subtle px-2 py-1 rounded-2 small" id="daily-income-max-badge">
                  <i class="bi bi-arrow-up-right me-1"></i> Puncak: <strong id="daily-income-max-val">-</strong>
                </span>
              </div>
            </div>
            <div class="chart-container" style="position: relative; height: 260px; width: 100%;">
              <canvas id="incomeChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="card card-budgetku p-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">Transaksi Terakhir</h5>
          <a href="{{ route('tracker.index') }}" class="btn btn-sm btn-outline-primary">Lihat Semua</a>
        </div>
        <div class="table-responsive">
          <table class="table table-hover table-transactions align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Keterangan</th>
                <th class="text-end">Nominal</th>
              </tr>
            </thead>
            <tbody id="recent-transactions-tbody">
              <!-- Transactions injected here -->
            </tbody>
          </table>
        </div>
        <div id="no-transactions" class="text-center text-muted d-none py-4">
          <i class="bi bi-inbox fs-3 d-block mb-1 text-secondary opacity-50"></i>
          Belum ada transaksi bulan ini.
        </div>

        <!-- Pagination for Recent Transactions -->
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 pt-2 border-top d-none" id="recent-pagination-container">
          <small class="text-muted" id="recent-pagination-info">Menampilkan 1-5 dari 10 transaksi</small>
          <nav aria-label="Navigasi Transaksi">
            <ul class="pagination pagination-sm flex-wrap justify-content-end mb-0" id="recent-pagination-ul">
              <!-- Pagination links injected via JS -->
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
  </main>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <!-- Chart.js (only for dashboard) -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
  
  <!-- Shared JS Files -->
  <script src="{{ asset('js/supabase.js') }}"></script>
  <script src="{{ asset('js/modal-alert.js') }}"></script>
  <script src="{{ asset('js/format.js') }}"></script>
  <script src="{{ asset('js/storage.js') }}"></script>
  <script src="{{ asset('js/dashboard.js') }}"></script>
  <script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
