<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup Budget - BudgetKu</title>
  
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

  <main class="container-fluid px-4 px-md-5 pt-3" style="margin-bottom: 120px;">
    <!-- Page Header -->
    <div class="page-header d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1 fw-bold text-dark">Setup Budget Bulanan</h1>
        <p class="text-muted mb-0 small">Atur dan alokasikan rencana keuangan Anda untuk bulan ini</p>
      </div>
    </div>

    <!-- Total Uang Bulanan Card -->
    <div class="card card-budgetku mb-4">
      <div class="card-body p-4">
        <h5 class="card-title fw-bold text-dark mb-1">Total Uang Bulanan</h5>
        <p class="text-muted small mb-3">Masukkan total alokasi saldo awal bulan ini berdasarkan sumber dana Anda</p>
        
        <div class="row g-3">
          <!-- Saldo Bank / E-Wallet -->
          <div class="col-12 col-md-6">
            <label for="total-budget-input" class="form-label fw-semibold text-dark small mb-1">
              <i class="bi bi-bank text-primary me-1"></i> Saldo Bank / E-Wallet
            </label>
            <div class="input-group">
              <span class="input-group-text bg-white">Rp</span>
              <input type="text" class="form-control form-control-lg fw-bold" id="total-budget-input" placeholder="0">
            </div>
            <div class="form-text small text-muted">Rekening bank, mobile banking, atau dompet digital.</div>
          </div>

          <!-- Uang Tunai -->
          <div class="col-12 col-md-6">
            <label for="total-cash-input" class="form-label fw-semibold text-dark small mb-1">
              <i class="bi bi-cash-stack text-success me-1"></i> Uang Tunai (Cash)
            </label>
            <div class="input-group">
              <span class="input-group-text bg-white">Rp</span>
              <input type="text" class="form-control form-control-lg fw-bold" id="total-cash-input" placeholder="0">
            </div>
            <div class="form-text small text-muted">Uang fisik di dompet, amplop, atau brankas.</div>
          </div>
        </div>

        <div class="d-grid gap-2 d-md-flex justify-content-md-end align-items-center mt-3 pt-2">
          <div id="budget-saved-feedback" class="form-text text-success d-none mb-0 me-md-3">
            <i class="bi bi-check-circle-fill"></i> Total budget bulanan berhasil disimpan.
          </div>
          <button class="btn btn-primary px-4 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2" id="btn-set-budget" type="button">
            <i class="bi bi-check-lg"></i> Set Budget
          </button>
        </div>
      </div>
    </div>

    <!-- Kategori & Alokasi Budget Card -->
    <div class="card card-budgetku mb-4">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h5 class="card-title mb-1 fw-bold text-dark">Kategori & Alokasi Budget</h5>
            <p class="text-muted small mb-0">Kelola dan tentukan batas rencana pengeluaran per pos</p>
          </div>
          <button class="btn btn-primary btn-sm px-3 py-2 fw-semibold rounded-2 d-flex align-items-center gap-1 shadow-sm" id="btn-add-category-top">
            <i class="bi bi-plus-lg"></i> Tambah Kategori
          </button>
        </div>

        <!-- Banner Salin Kategori dari Bulan Lalu -->
        <div id="banner-copy-categories" class="alert alert-info border-info-subtle rounded-3 p-3 mb-3 d-none">
          <div class="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-stars text-info fs-4"></i>
              <div>
                <h6 class="fw-bold mb-0 text-dark" id="banner-copy-title">Bulan Baru Telah Tiba!</h6>
                <p class="small text-muted mb-0" id="banner-copy-desc">Anda belum memiliki kategori untuk bulan ini. Ingin menyalin daftar kategori dari bulan lalu?</p>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2 ms-auto">
              <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-3" onclick="dismissCopyBanner()">Nanti Saja</button>
              <button type="button" class="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1" id="btn-copy-prev-categories" onclick="handleCopyPreviousCategories()">
                <i class="bi bi-copy me-1"></i> Salin Kategori
              </button>
            </div>
          </div>
        </div>

        <div id="categories-container" class="mt-3">
          <!-- Categories rendered via JS -->
        </div>

        <!-- Empty State -->
        <div id="empty-state-categories" class="empty-state text-center py-5 d-none">
          <i class="bi bi-folder2-open display-4 text-muted mb-3 d-block"></i>
          <h5 class="fw-bold">Belum ada kategori</h5>
          <p class="text-muted mb-3">Mulai buat kategori budget Anda untuk bulan ini.</p>
          <button class="btn btn-primary px-4 py-2 fw-semibold rounded-2" id="btn-add-category-empty">
            <i class="bi bi-plus-lg"></i> Tambah Kategori
          </button>
        </div>

      </div>
    </div>
  </main>

  <!-- Allocation Summary Bar (Permanently Fixed to Bottom) -->
  <footer class="allocation-bar">
    <div class="container-fluid px-4 px-md-5">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="fw-bold fs-6 text-dark">Total Teralokasi: <span id="allocated-text" class="text-primary">Rp 0 / Rp 0</span></span>
        <span class="badge bg-primary px-3 py-2 rounded-pill" id="allocation-badge">Sesuai Budget</span>
      </div>
      <div class="progress" style="height: 10px; border-radius: 6px; background-color: #e2e8f0;">
        <div class="progress-bar bg-primary" id="allocation-progress" role="progressbar" style="width: 0%; border-radius: 6px;"></div>
      </div>
    </div>
  </footer>

  <!-- Dialogs -->
  <!-- Add/Edit Category Dialog -->
  <dialog id="category-modal" class="modal-budgetku border-0 rounded shadow-lg p-0" style="width: 90%; max-width: 500px;">
    <div class="modal-content">
      <div class="modal-header-bk p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
        <h5 class="modal-title m-0 fw-bold" id="category-modal-title">Tambah Kategori</h5>
      </div>
      <div class="modal-body-bk p-4">
        <form id="category-form">
          <input type="hidden" id="cat-id-input">
          <div class="mb-3">
            <label class="form-label fw-medium">Nama Kategori <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="cat-name-input" placeholder="Contoh: Makanan, Transportasi" required>
            <div class="invalid-feedback">Nama kategori harus diisi.</div>
          </div>
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="form-label fw-medium mb-0">Budget Kategori <span class="text-danger">*</span></label>
              <small class="text-primary fw-semibold d-none" id="cat-budget-auto-helper">
                <i class="bi bi-calculator me-1"></i>Otomatis dari subkategori
              </small>
            </div>
            <div class="input-group">
              <span class="input-group-text bg-white">Rp</span>
              <input type="text" class="form-control" id="cat-budget-input" placeholder="0" required>
            </div>
            <div class="invalid-feedback">Budget harus lebih dari atau sama dengan 0.</div>
          </div>

          <div class="form-check mb-4 p-2 bg-light rounded border">
            <input class="form-check-input ms-1 me-2" type="checkbox" id="cat-is-savings">
            <label class="form-check-label text-dark fw-medium small" for="cat-is-savings">
              <i class="bi bi-piggy-bank text-primary me-1"></i> Kategori ini adalah Tabungan/Investasi
            </label>
          </div>
          
          <hr>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0 fw-medium">Subkategori (Opsional)</h6>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="btn-add-subcat">
              <i class="bi bi-plus"></i> Tambah
            </button>
          </div>
          <div id="subcat-list-container">
            <!-- Dynamic subcategory inputs -->
          </div>
        </form>
      </div>
      <div class="modal-footer-bk p-3 border-top d-flex justify-content-end gap-2 bg-light">
        <button type="button" class="btn btn-secondary" id="btn-cancel-cat-modal">Batal</button>
        <button type="button" class="btn btn-primary" id="btn-save-cat-modal">Simpan</button>
      </div>
    </div>
  </dialog>

  <!-- Delete Confirmation Dialog -->
  <dialog id="delete-confirm-modal" class="modal-budgetku border-0 rounded shadow-lg p-0" style="width: 90%; max-width: 400px;">
    <div class="modal-content p-4 text-center">
      <i class="bi bi-exclamation-triangle-fill text-danger display-4 mb-3 d-block"></i>
      <h5 class="mb-3 fw-bold">Hapus Kategori?</h5>
      <p id="delete-confirm-text" class="mb-4 text-muted">Apakah Anda yakin ingin menghapus kategori ini?</p>
      <div class="d-flex justify-content-center gap-2">
        <button type="button" class="btn btn-secondary" id="btn-cancel-delete">Batal</button>
        <button type="button" class="btn btn-danger" id="btn-confirm-delete">Hapus</button>
      </div>
    </div>
  </dialog>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- App Scripts -->
  <script src="{{ asset('js/supabase.js') }}"></script>
  <script src="{{ asset('js/modal-alert.js') }}"></script>
  <script src="{{ asset('js/format.js') }}"></script>
  <script src="{{ asset('js/storage.js') }}"></script>
  <script src="{{ asset('js/budget.js') }}"></script>
  <script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
