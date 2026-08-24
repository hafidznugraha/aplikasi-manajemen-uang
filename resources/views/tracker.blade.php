<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tracker Harian - BudgetKu</title>
  
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
<body class="bg-light pb-5 pt-5 mt-4">

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
            <a class="nav-link" href="{{ route('budget.index') }}"><i class="bi bi-piggy-bank"></i> Budget</a>
          </li>
          <li class="nav-item">
            <a class="nav-link active" href="{{ route('tracker.index') }}"><i class="bi bi-journal-text"></i> Tracker</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="{{ route('arsip.index') }}"><i class="bi bi-archive"></i> Arsip</a>
          </li>
        </ul>
        <span class="month-selector" id="current-month-display">
          <i class="bi bi-calendar3"></i>
        </span>
      </div>
    </div>
  </nav>

  <div class="container mt-4">
    <!-- Page Header -->
    <div class="page-header d-flex justify-content-between align-items-center mb-4">
      <h2 class="h4 mb-0 fw-bold">Tracker Harian</h2>
      <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#formPengeluaran" aria-expanded="false" aria-controls="formPengeluaran">
        <i class="bi bi-plus-lg"></i> Tambah Pengeluaran
      </button>
    </div>

    <!-- Add Expense Form Collapse -->
    <div class="collapse mb-4" id="formPengeluaran">
      <div class="card card-budgetku card-body border-0 shadow-sm">
        <h5 class="card-title mb-4">Tambah Pengeluaran Baru</h5>
        <form id="add-transaction-form" onsubmit="event.preventDefault(); submitTransaction();">
          
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label for="txn-date" class="form-label">Tanggal</label>
              <input type="date" class="form-control" id="txn-date" required>
            </div>
            <div class="col-md-4">
              <label for="txn-category" class="form-label">Kategori</label>
              <select class="form-select" id="txn-category" required onchange="handleCategoryChange()">
                <option value="" disabled selected>Pilih Kategori</option>
              </select>
            </div>
            <div class="col-md-4">
              <label for="txn-subcategory" class="form-label">Sub-Kategori</label>
              <select class="form-select" id="txn-subcategory">
                <option value="">Tidak ada sub-kategori</option>
              </select>
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label for="txn-desc" class="form-label">Keterangan</label>
              <input type="text" class="form-control" id="txn-desc" placeholder="Contoh: Makan siang" required>
            </div>
            <div class="col-md-6">
              <label for="txn-amount" class="form-label">Nominal</label>
              <div class="input-group">
                <span class="input-group-text">Rp</span>
                <input type="text" class="form-control" id="txn-amount" placeholder="0" required oninput="formatInputRupiah(this)">
              </div>
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label">Upload Struk (Opsional)</label>
            <div class="upload-zone p-4 text-center rounded border border-2 border-dashed" id="upload-zone" onclick="document.getElementById('txn-receipt').click()" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event)">
              <i class="bi bi-cloud-arrow-up fs-2 text-secondary"></i>
              <p class="mb-1">Klik atau seret file ke sini</p>
              <small class="text-muted">Format .jpg, .jpeg, .png (Maks 1MB)</small>
              <input type="file" id="txn-receipt" class="d-none" accept=".jpg,.jpeg,.png" onchange="handleFileSelect(event)">
            </div>
            <div class="upload-preview mt-3 d-none align-items-center p-2 border rounded" id="upload-preview">
              <img id="preview-img" src="" alt="Preview" class="rounded me-3" style="width: 50px; height: 50px; object-fit: cover;">
              <div class="flex-grow-1">
                <div id="preview-filename" class="fw-medium small text-truncate" style="max-width: 200px;"></div>
                <div id="preview-filesize" class="text-muted small"></div>
              </div>
              <button type="button" class="btn btn-sm btn-outline-danger border-0" onclick="removeFile(event)">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-light" data-bs-toggle="collapse" data-bs-target="#formPengeluaran" onclick="resetForm()">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar bg-white p-3 rounded shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center">
      <div class="flex-grow-1" style="min-width: 200px;">
        <select class="form-select" id="filter-category" onchange="applyFilters()">
          <option value="">Semua Kategori</option>
        </select>
      </div>
      <div class="d-flex align-items-center gap-2">
        <label for="filter-date-start" class="text-muted small mb-0">Dari</label>
        <input type="date" class="form-control form-control-sm" id="filter-date-start" onchange="applyFilters()">
      </div>
      <div class="d-flex align-items-center gap-2">
        <label for="filter-date-end" class="text-muted small mb-0">Sampai</label>
        <input type="date" class="form-control form-control-sm" id="filter-date-end" onchange="applyFilters()">
      </div>
      <button class="btn btn-sm btn-outline-secondary" onclick="resetFilters()">Reset</button>
    </div>

    <!-- Transaction Table -->
    <div class="card card-budgetku border-0 shadow-sm mb-4">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-transactions mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th scope="col" class="ps-4">Tanggal</th>
                <th scope="col">Kategori</th>
                <th scope="col">Keterangan</th>
                <th scope="col" class="text-end">Nominal</th>
                <th scope="col" class="text-center">Struk</th>
                <th scope="col" class="text-end pe-4">Aksi</th>
              </tr>
            </thead>
            <tbody id="transaction-tbody">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div id="empty-state" class="empty-state text-center py-5 d-none">
      <i class="bi bi-journal-x display-1 text-muted mb-3 opacity-50"></i>
      <h5 class="text-muted">Belum ada pengeluaran</h5>
      <p class="text-muted small">Mulai catat pengeluaran Anda dengan menekan tombol tambah.</p>
    </div>

    <!-- Pagination -->
    <nav aria-label="Page navigation" id="pagination-nav" class="d-none">
      <ul class="pagination justify-content-center" id="pagination-ul">
        <!-- Rendered via JS -->
      </ul>
    </nav>
  </div>

  <!-- Dialog: Receipt Preview -->
  <dialog id="receiptDialog" class="modal-budgetku rounded shadow border-0 p-0" style="max-width: 500px; width: 90%;">
    <div class="modal-header-bk d-flex justify-content-between align-items-center p-3 border-bottom">
      <h5 class="m-0">Preview Struk</h5>
      <button class="btn btn-sm btn-light border-0" onclick="document.getElementById('receiptDialog').close()"><i class="bi bi-x-lg"></i></button>
    </div>
    <div class="modal-body-bk p-3 text-center">
      <img id="dialog-receipt-img" src="" alt="Struk" class="img-fluid rounded mb-3" style="max-height: 60vh; object-fit: contain;">
      <div class="text-start bg-light p-3 rounded small">
        <div class="mb-1"><strong class="text-muted">Tanggal:</strong> <span id="dialog-receipt-date"></span></div>
        <div class="mb-1"><strong class="text-muted">Kategori:</strong> <span id="dialog-receipt-category"></span></div>
        <div class="mb-1"><strong class="text-muted">Keterangan:</strong> <span id="dialog-receipt-desc"></span></div>
        <div><strong class="text-muted">Nominal:</strong> <span id="dialog-receipt-amount" class="fw-bold"></span></div>
      </div>
    </div>
  </dialog>

  <!-- Dialog: Edit Transaction -->
  <dialog id="editTxnDialog" class="modal-budgetku rounded shadow border-0 p-0" style="max-width: 600px; width: 95%;">
    <div class="modal-header-bk d-flex justify-content-between align-items-center p-3 border-bottom">
      <h5 class="m-0">Edit Pengeluaran</h5>
      <button class="btn btn-sm btn-light border-0" onclick="closeEditDialog()"><i class="bi bi-x-lg"></i></button>
    </div>
    <form id="edit-transaction-form" onsubmit="event.preventDefault(); submitEditTransaction();">
      <div class="modal-body-bk p-3">
        <input type="hidden" id="edit-txn-id">
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label for="edit-txn-date" class="form-label">Tanggal</label>
            <input type="date" class="form-control" id="edit-txn-date" required>
          </div>
          <div class="col-md-6">
            <label for="edit-txn-category" class="form-label">Kategori</label>
            <select class="form-select" id="edit-txn-category" required onchange="handleEditCategoryChange()">
            </select>
          </div>
        </div>
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label for="edit-txn-subcategory" class="form-label">Sub-Kategori</label>
            <select class="form-select" id="edit-txn-subcategory">
            </select>
          </div>
          <div class="col-md-6">
            <label for="edit-txn-amount" class="form-label">Nominal</label>
            <div class="input-group">
              <span class="input-group-text">Rp</span>
              <input type="text" class="form-control" id="edit-txn-amount" required oninput="formatInputRupiah(this)">
            </div>
          </div>
        </div>
        <div class="mb-3">
          <label for="edit-txn-desc" class="form-label">Keterangan</label>
          <input type="text" class="form-control" id="edit-txn-desc" required>
        </div>
      </div>
      <div class="modal-footer-bk p-3 border-top d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-light" onclick="closeEditDialog()">Batal</button>
        <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
      </div>
    </form>
  </dialog>

  <!-- Dialog: Delete Confirmation -->
  <dialog id="deleteConfirmDialog" class="modal-budgetku border-0 rounded shadow-lg p-0" style="max-width: 400px;">
    <div class="modal-body-bk p-4 text-center">
      <i class="bi bi-exclamation-triangle text-danger display-4 mb-3 d-block"></i>
      <h5 class="mb-3">Hapus Pengeluaran?</h5>
      <p class="text-muted mb-4">Pengeluaran ini dan bukti struk (jika ada) akan dihapus secara permanen.</p>
      <div class="d-flex justify-content-center gap-2">
        <button type="button" class="btn btn-light" onclick="closeDeleteDialog()">Batal</button>
        <button type="button" class="btn btn-danger" id="btn-confirm-delete">Hapus</button>
      </div>
    </div>
  </dialog>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- Shared JS -->
  <script src="{{ asset('js/format.js') }}"></script>
  <script src="{{ asset('js/storage.js') }}"></script>
  <script src="{{ asset('js/tracker.js') }}"></script>
  <script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
