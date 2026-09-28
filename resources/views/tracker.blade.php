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
      <!-- Print-Only Header -->
      <div class="print-header">
        <h2>BudgetKu: Rekapitulasi Transaksi</h2>
        <p id="print-subtitle">Laporan Mutasi Keuangan &bull; Diekspor pada: <span id="print-date"></span></p>
      </div>

      <!-- Page Header -->
      <div class="page-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 class="h3 mb-1 fw-bold">Tracker Harian</h1>
          <p class="text-secondary small mb-0">Catat dan pantau arus pengeluaran serta pemasukan tambahan Anda</p>
        </div>
        <div class="d-grid gap-2 d-md-flex justify-content-md-end w-100 w-md-auto">
          <!-- Export Dropdown -->
          <div class="dropdown">
            <button class="btn btn-outline-secondary px-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-download"></i> Ekspor
            </button>
            <ul class="dropdown-menu dropdown-menu-end mt-2">
              <li>
                <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="#" onclick="event.preventDefault(); exportToPDF();">
                  <i class="bi bi-file-earmark-pdf text-danger fs-5"></i>
                  <div>
                    <div class="fw-semibold small">Simpan sebagai PDF</div>
                    <div class="text-secondary" style="font-size: 0.75rem;">Cetak atau simpan via print browser</div>
                  </div>
                </a>
              </li>
              <li><hr class="dropdown-divider my-1"></li>
              <li>
                <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="#" onclick="event.preventDefault(); exportToCSV();">
                  <i class="bi bi-file-earmark-spreadsheet text-success fs-5"></i>
                  <div>
                    <div class="fw-semibold small">Unduh Excel / CSV</div>
                    <div class="text-secondary" style="font-size: 0.75rem;">Ekspor data yang difilter (.csv)</div>
                  </div>
                </a>
              </li>
            </ul>
          </div>

          <button class="btn btn-primary px-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2" type="button" data-bs-toggle="modal" data-bs-target="#addTransactionModal">
            <i class="bi bi-plus-lg"></i> Tambah Transaksi
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="card card-budgetku p-3 p-md-4 mb-4">
        <div class="row g-3 align-items-end">
          <!-- Dropdown Tipe -->
          <div class="col-12 col-md-3">
            <label for="filter-type" class="form-label text-secondary small mb-1 fw-medium">Tipe Transaksi</label>
            <select id="filter-type" onchange="applyFilters()">
              <option value="">Semua Tipe</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
              <option value="transfer">Mutasi Saldo</option>
              <option value="reallocation">Realokasi</option>
            </select>
          </div>

          <!-- Dropdown Kategori -->
          <div class="col-12 col-md-3">
            <label for="filter-category" class="form-label text-secondary small mb-1 fw-medium">Kategori</label>
            <select id="filter-category" onchange="applyFilters()">
              <option value="">Semua Kategori</option>
            </select>
          </div>

          <!-- Filter Rentang Tanggal: Dari -->
          <div class="col-6 col-md-2">
            <label for="filter-date-start" class="form-label text-secondary small mb-1 fw-medium">Dari</label>
            <input type="date" class="form-control" id="filter-date-start" onchange="applyFilters()">
          </div>

          <!-- Filter Rentang Tanggal: Sampai -->
          <div class="col-6 col-md-2">
            <label for="filter-date-end" class="form-label text-secondary small mb-1 fw-medium">Sampai</label>
            <input type="date" class="form-control" id="filter-date-end" onchange="applyFilters()">
          </div>

          <!-- Tombol Reset -->
          <div class="col-12 col-md-auto mt-3 mt-md-0">
            <button class="btn btn-outline-secondary px-3 py-2 fw-semibold w-100" onclick="resetFilters()">Reset</button>
          </div>
        </div>
      </div>

      <!-- Transaction Table Card -->
      <div class="card card-budgetku p-0 mb-4 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover table-transactions mb-0 align-middle">
            <thead>
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

      <!-- Empty State -->
      <div id="empty-state" class="empty-state text-center py-5 d-none">
        <i class="bi bi-journal-x display-1 text-secondary mb-3 opacity-50 d-block"></i>
        <h5 class="fw-bold">Belum ada transaksi</h5>
        <p class="text-secondary small">Mulai catat transaksi Anda dengan menekan tombol tambah.</p>
      </div>

      <!-- Pagination -->
      <nav aria-label="Page navigation" id="pagination-nav" class="d-none mt-3">
        <ul class="pagination pagination-sm flex-wrap justify-content-center" id="pagination-ul">
          <!-- Rendered via JS -->
        </ul>
      </nav>
    </div>
  </main>

  <!-- Add Transaction Modal (Liquid Glass Dialog) -->
  <div class="modal fade" id="addTransactionModal" tabindex="-1" aria-labelledby="addTransactionModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header px-4 py-3">
          <h5 class="modal-title fw-bold" id="addTransactionModalLabel">
            <i class="bi bi-receipt me-2 text-primary"></i>Tambah Transaksi Baru
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" onclick="resetForm()"></button>
        </div>
        <form id="add-transaction-form" onsubmit="event.preventDefault(); submitTransaction();">
          <div class="modal-body px-4 py-3">
            
            <!-- Segmented Control Nav-Tabs Tipe Transaksi -->
            <div class="mb-4">
              <ul class="nav nav-pills nav-fill p-1 rounded-pill" id="txn-nav-tabs" role="tablist" style="background: var(--bk-card-secondary-bg); border: 1px solid var(--bk-border);">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active fw-semibold d-flex align-items-center justify-content-center gap-2 rounded-pill py-2" id="tab-expense" type="button" role="tab" onclick="switchTxnType('expense')">
                    <i class="bi bi-dash-circle-fill text-danger"></i> Pengeluaran
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link fw-semibold d-flex align-items-center justify-content-center gap-2 rounded-pill py-2" id="tab-income" type="button" role="tab" onclick="switchTxnType('income')">
                    <i class="bi bi-plus-circle-fill text-success"></i> Pemasukan Tambahan
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link fw-semibold d-flex align-items-center justify-content-center gap-2 rounded-pill py-2" id="tab-transfer" type="button" role="tab" onclick="switchTxnType('transfer')">
                    <i class="bi bi-arrow-left-right text-primary"></i> Mutasi Saldo
                  </button>
                </li>
              </ul>
              <input type="hidden" id="selected-txn-type" value="expense">
            </div>

            <!-- Baris 1: Tanggal & Sumber Dana / Jenis Mutasi -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label for="txn-date" class="form-label fw-medium small">Tanggal</label>
                <input type="date" class="form-control" id="txn-date" required>
              </div>
              <div class="col-md-6" id="fund-source-col">
                <label for="txn-fund-source" class="form-label fw-medium small">Sumber Dana</label>
                <select id="txn-fund-source" class="form-select" required>
                  <option value="bank" selected>Saldo Bank / E-Wallet</option>
                  <option value="cash">Uang Tunai</option>
                </select>
              </div>
              <div class="col-md-6 d-none" id="transfer-type-col">
                <label for="txn-transfer-type" class="form-label fw-medium small">Jenis Mutasi</label>
                <select id="txn-transfer-type" class="form-select">
                  <option value="bank_to_cash" selected>Tarik Tunai (Bank ke Tunai)</option>
                  <option value="cash_to_bank">Setor Tunai (Tunai ke Bank)</option>
                </select>
              </div>
            </div>

            <!-- Baris 2: Kategori & Sub-Kategori (Hanya Pengeluaran) -->
            <div class="row g-3 mb-3" id="category-row">
              <div class="col-md-6" id="category-col">
                <label for="txn-category" class="form-label fw-medium small" id="txn-category-label">Kategori</label>
                <select id="txn-category" required onchange="handleCategoryChange()">
                  <option value="" disabled selected>Pilih Kategori</option>
                </select>
              </div>
              <div class="col-md-6" id="subcategory-col">
                <label for="txn-subcategory" class="form-label fw-medium small">Sub-Kategori</label>
                <select id="txn-subcategory">
                  <option value="">Tidak ada sub-kategori</option>
                </select>
              </div>
            </div>

            <!-- Baris 3: Keterangan & Nominal -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label for="txn-desc" class="form-label fw-medium small" id="txn-desc-label">Keterangan</label>
                <input type="text" class="form-control" id="txn-desc" placeholder="Contoh: Makan siang" required>
              </div>
              <div class="col-md-6">
                <label for="txn-amount" class="form-label fw-medium small">Nominal</label>
                <div class="input-group">
                  <span class="input-group-text">Rp</span>
                  <input type="text" class="form-control fw-bold text-rupiah" id="txn-amount" placeholder="0" required oninput="formatInputRupiah(this)">
                </div>
              </div>
            </div>

            <!-- Konfirmasi Tabungan Dinamis -->
            <div class="mb-3 d-none p-3 rounded-3 border" id="savings-confirmation-container" style="background-color: var(--bk-success-light); border-color: rgba(52, 199, 89, 0.3) !important;">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="txn-savings-confirm">
                <label class="form-check-label fw-semibold small text-success" for="txn-savings-confirm">
                  <i class="bi bi-piggy-bank-fill me-1"></i> Saya mengonfirmasi bahwa ini adalah alokasi tabungan
                </label>
              </div>
            </div>

            <div class="mb-2">
              <label class="form-label fw-medium small">Upload Struk (Opsional)</label>
              <div class="upload-zone p-3 text-center" id="upload-zone" onclick="document.getElementById('txn-receipt').click()" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event)">
                <i class="bi bi-cloud-arrow-up fs-3 text-primary d-block mb-1"></i>
                <p class="mb-1 fw-medium small">Klik atau seret file struk ke sini</p>
                <small class="text-secondary">Format .jpg, .jpeg, .png (Maks 1MB)</small>
                <input type="file" id="txn-receipt" class="d-none" accept=".jpg,.jpeg,.png" onchange="handleFileSelect(event)">
              </div>
              <div class="upload-preview mt-3 d-none align-items-center p-2 border rounded" id="upload-preview">
                <img id="preview-img" src="" alt="Preview" class="rounded me-3" style="width: 50px; height: 50px; object-fit: cover;">
                <div class="flex-grow-1">
                  <div id="preview-filename" class="fw-medium small text-truncate" style="max-width: 200px;"></div>
                  <div id="preview-filesize" class="text-secondary small"></div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger border-0" onclick="removeFile(event)">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer px-4 py-3">
            <button type="button" class="btn btn-secondary px-3" data-bs-dismiss="modal" onclick="resetForm()">Batal</button>
            <button type="submit" class="btn btn-primary px-4 fw-semibold">
              <i class="bi bi-check-lg me-1"></i> Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Dialog: Receipt Preview -->
  <dialog id="receiptDialog" class="modal-budgetku p-0" style="max-width: 500px; width: 90%;">
    <div class="modal-content">
      <div class="modal-header-bk d-flex justify-content-between align-items-center p-3 border-bottom">
        <h5 class="m-0 fw-bold">Preview Struk</h5>
        <button class="btn btn-sm btn-secondary border-0" onclick="document.getElementById('receiptDialog').close()"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body-bk p-3 text-center">
        <img id="dialog-receipt-img" src="" alt="Struk" class="img-fluid rounded-3 mb-3" style="max-height: 60vh; object-fit: contain;">
        <div class="text-start p-3 rounded-3 small border" style="background-color: var(--bk-card-secondary-bg);">
          <div class="mb-1"><strong class="text-secondary">Tanggal:</strong> <span id="dialog-receipt-date"></span></div>
          <div class="mb-1"><strong class="text-secondary">Kategori:</strong> <span id="dialog-receipt-category"></span></div>
          <div class="mb-1"><strong class="text-secondary">Keterangan:</strong> <span id="dialog-receipt-desc"></span></div>
          <div><strong class="text-secondary">Nominal:</strong> <span id="dialog-receipt-amount" class="fw-bold text-rupiah"></span></div>
        </div>
      </div>
    </div>
  </dialog>

  <!-- Dialog: Edit Transaction -->
  <dialog id="editTxnDialog" class="modal-budgetku p-0" style="max-width: 600px; width: 95%;">
    <div class="modal-content">
      <div class="modal-header-bk d-flex justify-content-between align-items-center p-3 border-bottom">
        <h5 class="m-0 fw-bold">Edit Transaksi</h5>
        <button class="btn btn-sm btn-secondary border-0" onclick="closeEditDialog()"><i class="bi bi-x-lg"></i></button>
      </div>
      <form id="edit-transaction-form" onsubmit="event.preventDefault(); submitEditTransaction();">
        <div class="modal-body-bk p-4">
          <input type="hidden" id="edit-txn-id">

          <div class="mb-3">
            <label class="form-label fw-semibold small mb-2">Tipe Transaksi</label>
            <div class="btn-group w-100" role="group" aria-label="Edit Tipe Transaksi">
              <input type="radio" class="btn-check" name="edit-txn-type" id="edit-type-expense" value="expense" checked autocomplete="off" onchange="handleEditTypeChange()">
              <label class="btn btn-outline-danger btn-sm fw-semibold py-2 d-flex align-items-center justify-content-center gap-2" for="edit-type-expense">
                <i class="bi bi-dash-circle-fill"></i> Pengeluaran
              </label>

              <input type="radio" class="btn-check" name="edit-txn-type" id="edit-type-income" value="income" autocomplete="off" onchange="handleEditTypeChange()">
              <label class="btn btn-outline-success btn-sm fw-semibold py-2 d-flex align-items-center justify-content-center gap-2" for="edit-type-income">
                <i class="bi bi-plus-circle-fill"></i> Pemasukan
              </label>

              <input type="radio" class="btn-check" name="edit-txn-type" id="edit-type-transfer" value="transfer" autocomplete="off" onchange="handleEditTypeChange()">
              <label class="btn btn-outline-primary btn-sm fw-semibold py-2 d-flex align-items-center justify-content-center gap-2" for="edit-type-transfer">
                <i class="bi bi-arrow-left-right"></i> Mutasi Saldo
              </label>
            </div>
          </div>

          <!-- Baris 1: Tanggal & Sumber Dana / Jenis Mutasi -->
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label for="edit-txn-date" class="form-label small">Tanggal</label>
              <input type="date" class="form-control" id="edit-txn-date" required>
            </div>
            <div class="col-md-6" id="edit-fund-source-col">
              <label for="edit-txn-fund-source" class="form-label small">Sumber Dana</label>
              <select id="edit-txn-fund-source" class="form-select" required>
                <option value="bank" selected>Saldo Bank / E-Wallet</option>
                <option value="cash">Uang Tunai</option>
              </select>
            </div>
            <div class="col-md-6 d-none" id="edit-transfer-type-col">
              <label for="edit-txn-transfer-type" class="form-label small">Jenis Mutasi</label>
              <select id="edit-txn-transfer-type" class="form-select">
                <option value="bank_to_cash" selected>Tarik Tunai (Bank ke Tunai)</option>
                <option value="cash_to_bank">Setor Tunai (Tunai ke Bank)</option>
              </select>
            </div>
          </div>

          <!-- Baris 2: Kategori & Sub-Kategori -->
          <div class="row g-3 mb-3" id="edit-category-row">
            <div class="col-md-6" id="edit-category-col">
              <label for="edit-txn-category" class="form-label small" id="edit-txn-category-label">Kategori</label>
              <select id="edit-txn-category" required onchange="handleEditCategoryChange()">
              </select>
            </div>
            <div class="col-md-6" id="edit-subcategory-col">
              <label for="edit-txn-subcategory" class="form-label small">Sub-Kategori</label>
              <select id="edit-txn-subcategory">
              </select>
            </div>
          </div>

          <!-- Baris 3: Keterangan & Nominal -->
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label for="edit-txn-desc" class="form-label small">Keterangan</label>
              <input type="text" class="form-control" id="edit-txn-desc" required>
            </div>
            <div class="col-md-6">
              <label for="edit-txn-amount" class="form-label small">Nominal</label>
              <div class="input-group">
                <span class="input-group-text">Rp</span>
                <input type="text" class="form-control fw-bold text-rupiah" id="edit-txn-amount" required oninput="formatInputRupiah(this)">
              </div>
            </div>
          </div>
          <!-- Konfirmasi Tabungan Dinamis (Edit) -->
          <div class="mb-3 d-none p-3 rounded-3 border" id="edit-savings-confirmation-container" style="background-color: var(--bk-success-light); border-color: rgba(52, 199, 89, 0.3) !important;">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="edit-txn-savings-confirm">
              <label class="form-check-label text-success fw-semibold small" for="edit-txn-savings-confirm">
                <i class="bi bi-piggy-bank-fill me-1"></i> Saya mengonfirmasi bahwa ini adalah alokasi tabungan
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer-bk p-3 border-top d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-secondary px-3" onclick="closeEditDialog()">Batal</button>
          <button type="submit" class="btn btn-primary px-3">Simpan Perubahan</button>
        </div>
      </form>
    </div>
  </dialog>

  <!-- Dialog: Delete Confirmation -->
  <dialog id="deleteConfirmDialog" class="modal-budgetku p-0" style="max-width: 400px;">
    <div class="modal-content p-4 text-center">
      <i class="bi bi-exclamation-triangle text-danger display-4 mb-3 d-block"></i>
      <h5 class="mb-2 fw-bold">Hapus Pengeluaran?</h5>
      <p class="text-secondary small mb-4">Pengeluaran ini dan bukti struk (jika ada) akan dihapus secara permanen.</p>
      <div class="d-flex justify-content-center gap-2">
        <button type="button" class="btn btn-secondary px-3" onclick="closeDeleteDialog()">Batal</button>
        <button type="button" class="btn btn-danger px-3" id="btn-confirm-delete" style="background-color: var(--bk-danger); border-color: var(--bk-danger); border-radius: var(--bk-radius-pill);">Hapus</button>
      </div>
    </div>
  </dialog>

  <!-- Dialog: Overbudget Reallocation Confirmation -->
  <dialog id="overbudget-modal" class="modal-budgetku p-0" style="max-width: 520px; width: 95%;">
    <div class="modal-content">
      <div class="modal-header-bk d-flex justify-content-between align-items-center p-3 border-bottom" style="background-color: var(--bk-warning-light);">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill fs-5 text-warning"></i>
          <h5 class="m-0 fw-bold">Peringatan Overbudget</h5>
        </div>
        <button class="btn btn-sm btn-secondary border-0" onclick="closeOverbudgetDialog()"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body-bk p-4">
        <div class="alert alert-warning border-0 d-flex align-items-start gap-3 mb-3" style="background-color: var(--bk-warning-light);">
          <i class="bi bi-info-circle-fill text-warning fs-5 mt-1"></i>
          <div>
            <p class="mb-0 small" id="overbudget-message">
              Pengeluaran ini melebihi sisa budget kategori <strong id="overbudget-target-cat-name">[Nama Kategori]</strong> sebesar <strong class="text-danger font-monospace text-rupiah" id="overbudget-deficit-amount">Rp 0</strong>. Anda harus menutupi kekurangan ini dari kategori lain.
            </p>
          </div>
        </div>

        <div class="mb-3">
          <label for="overbudget-source-cat" class="form-label fw-semibold small">Pilih Kategori Sumber Saldo:</label>
          <select class="form-select" id="overbudget-source-cat" onchange="handleOverbudgetSourceChange()">
            <!-- Populated dynamically via JS -->
          </select>
          <div class="form-text small text-secondary" id="overbudget-source-help">Pilih kategori yang masih memiliki sisa saldo positif.</div>
        </div>

        <!-- Realokasi Preview Card -->
        <div class="p-3 rounded-3 border mb-2 small" id="overbudget-preview-box" style="background-color: var(--bk-card-secondary-bg);">
          <div class="fw-semibold text-secondary mb-2">Simulasi Pemindahan Saldo:</div>
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span id="preview-source-name" class="text-secondary">Kategori Sumber:</span>
            <span id="preview-source-calc" class="font-monospace text-danger text-rupiah">Rp 0 &rarr; Rp 0</span>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <span id="preview-target-name" class="text-secondary">Kategori Tujuan:</span>
            <span id="preview-target-calc" class="font-monospace text-success text-rupiah">Rp 0 &rarr; Rp 0</span>
          </div>
        </div>
      </div>
      <div class="modal-footer-bk p-3 border-top d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary px-3" onclick="closeOverbudgetDialog()">Batal</button>
        <button type="button" class="btn btn-warning fw-semibold px-3" id="btn-confirm-reallocate" onclick="confirmAndReallocate()">
          <i class="bi bi-arrow-left-right me-1"></i> Konfirmasi & Pindahkan Saldo
        </button>
      </div>
    </div>
  </dialog>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <!-- Tom Select JS -->
  <script src="https://cdn.jsdelivr.net/npm/tom-select@2.3.1/dist/js/tom-select.complete.min.js"></script>
  
  <!-- Shared JS -->
  <script src="{{ asset('js/supabase.js') }}"></script>
  <script src="{{ asset('js/modal-alert.js') }}"></script>
  <script src="{{ asset('js/format.js') }}"></script>
  <script src="{{ asset('js/storage.js') }}"></script>
  <script src="{{ asset('js/tracker.js') }}"></script>
  <script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
