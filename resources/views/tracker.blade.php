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
  <!-- Tom Select CSS (Bootstrap 5 theme) -->
  <link href="https://cdn.jsdelivr.net/npm/tom-select@2.3.1/dist/css/tom-select.bootstrap5.min.css" rel="stylesheet">
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
            <a class="nav-link active" href="{{ route('tracker.index') }}"><i class="bi bi-journal-text"></i> Tracker</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="{{ route('arsip.index') }}"><i class="bi bi-archive"></i> Arsip</a>
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
                <a class="dropdown-item rounded-2 d-flex align-items-center gap-2 py-2 text-dark" href="{{ url('/profile') }}">
                  <i class="bi bi-person-gear text-primary"></i> Profil Saya
                </a>
              </li>
              <li><hr class="dropdown-divider my-1"></li>
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
    <!-- Print-Only Header -->
    <div class="print-header">
      <h2>BudgetKu &mdash; Rekapitulasi Transaksi</h2>
      <p id="print-subtitle">Laporan Mutasi Keuangan &bull; Diekspor pada: <span id="print-date"></span></p>
    </div>

    <!-- Page Header -->
    <div class="page-header d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h2 class="h4 mb-1 fw-bold text-dark">Tracker Harian</h2>
        <p class="text-muted small mb-0">Catat dan pantau arus pengeluaran serta pemasukan tambahan Anda</p>
      </div>
      <div class="d-flex align-items-center gap-2">
        <!-- Export Dropdown -->
        <div class="dropdown">
          <button class="btn btn-outline-secondary px-3 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-download"></i> Ekspor
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow border-0 py-2">
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="#" onclick="event.preventDefault(); exportToPDF();">
                <i class="bi bi-file-earmark-pdf text-danger fs-5"></i>
                <div>
                  <div class="fw-semibold small">Simpan sebagai PDF</div>
                  <div class="text-muted" style="font-size: 0.75rem;">Cetak atau simpan via print browser</div>
                </div>
              </a>
            </li>
            <li><hr class="dropdown-divider my-1"></li>
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="#" onclick="event.preventDefault(); exportToCSV();">
                <i class="bi bi-file-earmark-spreadsheet text-success fs-5"></i>
                <div>
                  <div class="fw-semibold small">Unduh Excel / CSV</div>
                  <div class="text-muted" style="font-size: 0.75rem;">Ekspor data yang difilter (.csv)</div>
                </div>
              </a>
            </li>
          </ul>
        </div>

        <button class="btn btn-primary px-3 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2" type="button" data-bs-toggle="modal" data-bs-target="#addTransactionModal">
          <i class="bi bi-plus-lg"></i> Tambah Transaksi
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar bg-white p-3 rounded-4 shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center">
      <!-- Dropdown Tipe & Kategori (Kiri) -->
      <div class="d-flex flex-wrap gap-3 align-items-center">
        <div style="min-width: 200px;">
          <select id="filter-type" onchange="applyFilters()">
            <option value="">Semua Tipe</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="reallocation">Realokasi</option>
          </select>
        </div>
        <div style="min-width: 200px;">
          <select id="filter-category" onchange="applyFilters()">
            <option value="">Semua Kategori</option>
          </select>
        </div>
      </div>

      <!-- Filter Tanggal & Tombol Reset (Kanan) -->
      <div class="ms-auto d-flex flex-wrap gap-2 align-items-center">
        <div class="d-flex align-items-center gap-2">
          <label for="filter-date-start" class="text-muted small mb-0 fw-medium">Dari</label>
          <input type="date" class="form-control form-control-sm rounded-3" id="filter-date-start" onchange="applyFilters()">
        </div>
        <div class="d-flex align-items-center gap-2">
          <label for="filter-date-end" class="text-muted small mb-0 fw-medium">Sampai</label>
          <input type="date" class="form-control form-control-sm rounded-3" id="filter-date-end" onchange="applyFilters()">
        </div>
        <button class="btn btn-sm btn-outline-secondary rounded-3 px-3 py-1 fw-semibold" onclick="resetFilters()">Reset</button>
      </div>
    </div>

    <!-- Transaction Table -->
    <div class="card card-budgetku border-0 shadow-sm mb-4">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-transactions mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th scope="col" class="ps-4">Tanggal</th>
                <th scope="col">Tipe / Kategori</th>
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
  </main>

  <!-- Add Transaction Modal (Bootstrap 5 modal-lg at root body level) -->
  <div class="modal fade" id="addTransactionModal" tabindex="-1" aria-labelledby="addTransactionModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header border-bottom px-4 py-3">
          <h5 class="modal-title fw-bold text-dark" id="addTransactionModalLabel">
            <i class="bi bi-receipt me-2 text-primary"></i>Tambah Transaksi Baru
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" onclick="resetForm()"></button>
        </div>
        <form id="add-transaction-form" onsubmit="event.preventDefault(); submitTransaction();">
          <div class="modal-body px-4 py-3">
            
            <!-- Tipe Transaksi: Pengeluaran vs Pemasukan -->
            <div class="mb-4">
              <label class="form-label fw-semibold text-dark small mb-2">Tipe Transaksi</label>
              <div class="btn-group w-100" role="group" aria-label="Tipe Transaksi">
                <input type="radio" class="btn-check" name="txn-type" id="type-expense" value="expense" checked autocomplete="off" onchange="handleTypeChange()">
                <label class="btn btn-outline-danger fw-semibold py-2 d-flex align-items-center justify-content-center gap-2" for="type-expense">
                  <i class="bi bi-dash-circle-fill"></i> Pengeluaran
                </label>

                <input type="radio" class="btn-check" name="txn-type" id="type-income" value="income" autocomplete="off" onchange="handleTypeChange()">
                <label class="btn btn-outline-success fw-semibold py-2 d-flex align-items-center justify-content-center gap-2" for="type-income">
                  <i class="bi bi-plus-circle-fill"></i> Pemasukan Tambahan
                </label>
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <label for="txn-date" class="form-label fw-medium small">Tanggal</label>
                <input type="date" class="form-control" id="txn-date" required>
              </div>
              <div class="col-md-4" id="category-col">
                <label for="txn-category" class="form-label fw-medium small" id="txn-category-label">Kategori</label>
                <select id="txn-category" required onchange="handleCategoryChange()">
                  <option value="" disabled selected>Pilih Kategori</option>
                </select>
              </div>
              <div class="col-md-4" id="subcategory-col">
                <label for="txn-subcategory" class="form-label fw-medium small">Sub-Kategori</label>
                <select id="txn-subcategory">
                  <option value="">Tidak ada sub-kategori</option>
                </select>
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label for="txn-desc" class="form-label fw-medium small" id="txn-desc-label">Keterangan</label>
                <input type="text" class="form-control" id="txn-desc" placeholder="Contoh: Makan siang" required>
              </div>
              <div class="col-md-6">
                <label for="txn-amount" class="form-label fw-medium small">Nominal</label>
                <div class="input-group">
                  <span class="input-group-text bg-light">Rp</span>
                  <input type="text" class="form-control fw-bold" id="txn-amount" placeholder="0" required oninput="formatInputRupiah(this)">
                </div>
              </div>
            </div>

            <!-- Konfirmasi Tabungan Dinamis -->
            <div class="mb-3 d-none p-3 bg-success-subtle rounded border border-success-subtle" id="savings-confirmation-container">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="txn-savings-confirm">
                <label class="form-check-label text-success-emphasis fw-semibold small" for="txn-savings-confirm">
                  <i class="bi bi-piggy-bank-fill me-1"></i> Saya mengonfirmasi bahwa ini adalah alokasi tabungan
                </label>
              </div>
            </div>

            <div class="mb-2">
              <label class="form-label fw-medium small">Upload Struk (Opsional)</label>
              <div class="upload-zone p-3 text-center rounded border border-2 border-dashed bg-light bg-opacity-50" id="upload-zone" onclick="document.getElementById('txn-receipt').click()" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event)">
                <i class="bi bi-cloud-arrow-up fs-3 text-secondary"></i>
                <p class="mb-1 fw-medium text-dark small">Klik atau seret file ke sini</p>
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
          </div>
          <div class="modal-footer border-top px-4 py-3 bg-light">
            <button type="button" class="btn btn-secondary px-3" data-bs-dismiss="modal" onclick="resetForm()">Batal</button>
            <button type="submit" class="btn btn-primary px-4 fw-semibold">
              <i class="bi bi-check-lg me-1"></i>Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
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
      <h5 class="m-0 fw-bold">Edit Transaksi</h5>
      <button class="btn btn-sm btn-light border-0" onclick="closeEditDialog()"><i class="bi bi-x-lg"></i></button>
    </div>
    <form id="edit-transaction-form" onsubmit="event.preventDefault(); submitEditTransaction();">
      <div class="modal-body-bk p-3">
        <input type="hidden" id="edit-txn-id">

        <div class="mb-3">
          <label class="form-label fw-semibold text-dark small mb-2">Tipe Transaksi</label>
          <div class="btn-group w-100" role="group" aria-label="Edit Tipe Transaksi">
            <input type="radio" class="btn-check" name="edit-txn-type" id="edit-type-expense" value="expense" checked autocomplete="off" onchange="handleEditTypeChange()">
            <label class="btn btn-outline-danger btn-sm fw-semibold py-2 d-flex align-items-center justify-content-center gap-2" for="edit-type-expense">
              <i class="bi bi-dash-circle-fill"></i> Pengeluaran
            </label>

            <input type="radio" class="btn-check" name="edit-txn-type" id="edit-type-income" value="income" autocomplete="off" onchange="handleEditTypeChange()">
            <label class="btn btn-outline-success btn-sm fw-semibold py-2 d-flex align-items-center justify-content-center gap-2" for="edit-type-income">
              <i class="bi bi-plus-circle-fill"></i> Pemasukan
            </label>
          </div>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label for="edit-txn-date" class="form-label">Tanggal</label>
            <input type="date" class="form-control" id="edit-txn-date" required>
          </div>
          <div class="col-md-6" id="edit-category-col">
            <label for="edit-txn-category" class="form-label" id="edit-txn-category-label">Kategori</label>
            <select id="edit-txn-category" required onchange="handleEditCategoryChange()">
            </select>
          </div>
        </div>
        <div class="row g-3 mb-3" id="edit-subcategory-row">
          <div class="col-md-6">
            <label for="edit-txn-subcategory" class="form-label">Sub-Kategori</label>
            <select id="edit-txn-subcategory">
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
        <!-- Konfirmasi Tabungan Dinamis (Edit) -->
        <div class="mb-3 d-none p-3 bg-success-subtle rounded border border-success-subtle" id="edit-savings-confirmation-container">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="edit-txn-savings-confirm">
            <label class="form-check-label text-success-emphasis fw-semibold small" for="edit-txn-savings-confirm">
              <i class="bi bi-piggy-bank-fill me-1"></i> Saya mengonfirmasi bahwa ini adalah alokasi tabungan
            </label>
          </div>
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

  <!-- Dialog: Overbudget Reallocation Confirmation -->
  <dialog id="overbudget-modal" class="modal-budgetku rounded shadow-lg border-0 p-0" style="max-width: 520px; width: 95%;">
    <div class="modal-header-bk d-flex justify-content-between align-items-center p-3 border-bottom bg-warning-subtle text-warning-emphasis">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-exclamation-triangle-fill fs-5 text-warning"></i>
        <h5 class="m-0 fw-bold">Peringatan Overbudget</h5>
      </div>
      <button class="btn btn-sm btn-light border-0" onclick="closeOverbudgetDialog()"><i class="bi bi-x-lg"></i></button>
    </div>
    <div class="modal-body-bk p-4">
      <div class="alert alert-warning border-0 bg-warning bg-opacity-10 d-flex align-items-start gap-3 mb-3">
        <i class="bi bi-info-circle-fill text-warning fs-5 mt-1"></i>
        <div>
          <p class="mb-0 text-dark small" id="overbudget-message">
            Pengeluaran ini melebihi sisa budget kategori <strong id="overbudget-target-cat-name">[Nama Kategori]</strong> sebesar <strong class="text-danger font-monospace" id="overbudget-deficit-amount">Rp 0</strong>. Anda harus menutupi kekurangan ini dari kategori lain.
          </p>
        </div>
      </div>

      <div class="mb-3">
        <label for="overbudget-source-cat" class="form-label fw-semibold small text-dark">Pilih Kategori Sumber Saldo:</label>
        <select class="form-select" id="overbudget-source-cat" onchange="handleOverbudgetSourceChange()">
          <!-- Populated dynamically via JS -->
        </select>
        <div class="form-text small text-muted" id="overbudget-source-help">Pilih kategori yang masih memiliki sisa saldo positif.</div>
      </div>

      <!-- Realokasi Preview Card -->
      <div class="p-3 bg-light rounded border mb-2 small" id="overbudget-preview-box">
        <div class="fw-semibold text-secondary mb-2">Simulasi Pemindahan Saldo:</div>
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span id="preview-source-name" class="text-muted">Kategori Sumber:</span>
          <span id="preview-source-calc" class="font-monospace text-danger">Rp 0 &rarr; Rp 0</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span id="preview-target-name" class="text-muted">Kategori Tujuan:</span>
          <span id="preview-target-calc" class="font-monospace text-success">Rp 0 &rarr; Rp 0</span>
        </div>
      </div>
    </div>
    <div class="modal-footer-bk p-3 border-top d-flex justify-content-end gap-2 bg-light">
      <button type="button" class="btn btn-light" onclick="closeOverbudgetDialog()">Batal</button>
      <button type="button" class="btn btn-warning fw-semibold text-dark" id="btn-confirm-reallocate" onclick="confirmAndReallocate()">
        <i class="bi bi-arrow-left-right me-1"></i> Konfirmasi & Pindahkan Saldo
      </button>
    </div>
  </dialog>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <!-- Tom Select JS -->
  <script src="https://cdn.jsdelivr.net/npm/tom-select@2.3.1/dist/js/tom-select.complete.min.js"></script>
  
  <!-- Shared JS -->
  <script src="{{ asset('js/modal-alert.js') }}"></script>
  <script src="{{ asset('js/format.js') }}"></script>
  <script src="{{ asset('js/storage.js') }}"></script>
  <script src="{{ asset('js/tracker.js') }}"></script>
  <script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
