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
  
  <!-- Supabase JS & Server Hydrated Data for Instant & Realtime Loading -->
  <script>
    window.__SUPABASE_CONFIG__ = {
      url: "{{ env('SUPABASE_URL') }}",
      key: "{{ env('SUPABASE_KEY') }}"
    };
    window.__INITIAL_DATA__ = @json($initialData ?? null);
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body class="bg-light">
  <!-- Shared Navbar -->
  <nav class="navbar navbar-expand-md navbar-budgetku fixed-top">
    <div class="container">
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
            <a class="nav-link active" href="{{ route('budget.index') }}"><i class="bi bi-piggy-bank"></i> Budget</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="{{ route('tracker.index') }}"><i class="bi bi-journal-text"></i> Tracker</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="{{ route('arsip.index') }}"><i class="bi bi-archive"></i> Arsip</a>
          </li>
        </ul>
        <span class="month-selector" id="current-month-display">
          <i class="bi bi-calendar3"></i> <span id="month-text"></span>
        </span>
      </div>
    </div>
  </nav>

  <main class="container" style="margin-top: 80px; margin-bottom: 120px;">
    <!-- Page Header -->
    <div class="page-header d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Setup Budget Bulanan</h1>
    </div>

    <!-- Total Uang Bulanan Card -->
    <div class="card card-budgetku mb-4">
      <div class="card-body">
        <h5 class="card-title">Total Uang Bulanan</h5>
        <p class="text-muted small">Masukkan total pendapatan atau alokasi bulan ini</p>
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0">Rp</span>
          <input type="text" class="form-control form-control-lg fw-bold border-start-0" id="total-budget-input" placeholder="0">
          <button class="btn btn-primary px-4 fw-semibold" id="btn-set-budget" type="button">
            <i class="bi bi-check-lg"></i> Set
          </button>
        </div>
        <div id="budget-saved-feedback" class="form-text text-success d-none mt-2">
          <i class="bi bi-check-circle-fill"></i> Total budget berhasil disimpan ke database Supabase!
        </div>
      </div>
    </div>

    <!-- Kategori & Alokasi Budget Card -->
    <div class="card card-budgetku mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="card-title mb-0">Kategori & Alokasi Budget</h5>
          <button class="btn btn-primary btn-sm d-none" id="btn-add-category-top">
            <i class="bi bi-plus-circle"></i> Tambah Kategori
          </button>
        </div>

        <div id="categories-container">
          <!-- Categories rendered via JS -->
        </div>

        <div class="mt-3 text-center" id="add-category-bottom-container">
          <button class="btn btn-outline-primary" id="btn-add-category-bottom">
            <i class="bi bi-plus-circle"></i> Tambah Kategori
          </button>
        </div>

        <!-- Empty State -->
        <div id="empty-state-categories" class="empty-state text-center py-5 d-none">
          <i class="bi bi-folder2-open display-4 text-muted mb-3 d-block"></i>
          <h5>Belum ada kategori</h5>
          <p class="text-muted mb-3">Mulai buat kategori budget Anda untuk bulan ini.</p>
          <button class="btn btn-primary" id="btn-add-category-empty">
            <i class="bi bi-plus-circle"></i> Tambah Kategori
          </button>
        </div>

      </div>
    </div>
  </main>

  <!-- Allocation Summary Bar -->
  <div class="allocation-bar fixed-bottom bg-white border-top py-3 shadow-sm" style="z-index: 1030;">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="fw-bold">Total Teralokasi: <span id="allocated-text">Rp 0 / Rp 0</span></span>
        <span class="badge bg-primary" id="allocation-badge">Sesuai Budget</span>
      </div>
      <div class="progress" style="height: 10px;">
        <div class="progress-bar bg-primary" id="allocation-progress" role="progressbar" style="width: 0%;"></div>
      </div>
    </div>
  </div>

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
          <div class="mb-4">
            <label class="form-label fw-medium">Budget Kategori <span class="text-danger">*</span></label>
            <div class="input-group">
              <span class="input-group-text bg-white">Rp</span>
              <input type="text" class="form-control" id="cat-budget-input" placeholder="0" required>
            </div>
            <div class="invalid-feedback">Budget harus lebih dari atau sama dengan 0.</div>
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
  <script src="{{ asset('js/format.js') }}"></script>
  <script src="{{ asset('js/storage.js') }}"></script>
  <script src="{{ asset('js/budget.js') }}"></script>
  <script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
