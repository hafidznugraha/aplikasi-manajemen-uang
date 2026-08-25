<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profil Saya - BudgetKu</title>
  
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <!-- Google Fonts: Inter -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Custom CSS -->
  <link href="{{ asset('css/style.css') }}" rel="stylesheet">
</head>
<body style="background-color: #f8fafc; font-family: 'Inter', sans-serif;">

  @include('partials.navbar')

  <!-- Main Content Container -->
  <main class="main-content">
    <div class="container-fluid px-4 px-md-5 py-4">
      
      <!-- Page Header -->
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 class="fw-bold text-dark mb-1">
            <i class="bi bi-person-gear text-primary me-2"></i>Profil Pengguna
          </h4>
          <p class="text-muted small mb-0">Kelola informasi akun dan pengaturan keamanan kata sandi Anda</p>
        </div>
      </div>

      <!-- Content Grid: 2 Cards -->
      <div class="row g-4">
        
        <!-- CARD 1: Informasi Akun -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div class="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle" style="width: 56px; height: 56px;">
                <i class="bi bi-person-circle fs-2"></i>
              </div>
              <div class="flex-grow-1 overflow-hidden">
                <h5 class="fw-bold text-dark mb-0 text-truncate" id="card-user-name">Memuat...</h5>
                <span class="badge bg-success bg-opacity-10 text-success fw-medium px-2 py-1 mt-1">
                  <i class="bi bi-shield-check me-1"></i>Akun Terverifikasi
                </span>
              </div>
            </div>

            <form id="profile-info-form">
              <!-- Nama Lengkap Input -->
              <div class="mb-3">
                <label for="profile-name" class="form-label fw-medium text-dark small">Nama Lengkap</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-person"></i></span>
                  <input type="text" class="form-control bg-light border-start-0 ps-0 text-dark fw-medium" id="profile-name" readonly disabled>
                </div>
              </div>

              <!-- Alamat Email Input -->
              <div class="mb-3">
                <label for="profile-email" class="form-label fw-medium text-dark small">Alamat Email</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-envelope"></i></span>
                  <input type="email" class="form-control bg-light border-start-0 ps-0 text-dark fw-medium" id="profile-email" readonly disabled>
                </div>
              </div>

              <!-- Info Box -->
              <div class="alert alert-light border small text-muted mb-0 d-flex align-items-center gap-2 mt-4">
                <i class="bi bi-shield-check text-success fs-5"></i>
                <span>Data akun Anda dilindungi dengan sistem enkripsi tingkat lanjut dan disimpan secara aman.</span>
              </div>
            </form>
          </div>
        </div>

        <!-- CARD 2: Ubah Kata Sandi -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div class="d-flex align-items-center gap-2 mb-4 pb-3 border-bottom">
              <div class="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 text-warning rounded-circle" style="width: 40px; height: 40px;">
                <i class="bi bi-shield-lock-fill fs-5"></i>
              </div>
              <h5 class="fw-bold text-dark mb-0">Ubah Kata Sandi</h5>
            </div>

            <form id="profile-password-form" onsubmit="return handleUpdatePassword(event);">
              <!-- Kata Sandi Baru -->
              <div class="mb-3">
                <label for="new-password" class="form-label fw-medium text-dark small">Kata Sandi Baru</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-lock"></i></span>
                  <input type="password" class="form-control border-start-0 ps-0" id="new-password" placeholder="Minimal 6 karakter" required minlength="6" autocomplete="new-password">
                </div>
              </div>

              <!-- Konfirmasi Kata Sandi Baru -->
              <div class="mb-4">
                <label for="confirm-password" class="form-label fw-medium text-dark small">Konfirmasi Kata Sandi Baru</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-shield-check"></i></span>
                  <input type="password" class="form-control border-start-0 ps-0" id="confirm-password" placeholder="Ulangi kata sandi baru" required minlength="6" autocomplete="new-password">
                </div>
              </div>

              <!-- Tombol Submit -->
              <button type="submit" id="btn-save-password" class="btn btn-primary w-100 py-2 fw-semibold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2">
                <i class="bi bi-check2-circle"></i> Simpan Kata Sandi
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  </main>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <!-- Modal Alert & Supabase JS SDK -->
  <script src="{{ asset('js/modal-alert.js') }}"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <!-- Shared JS -->
  <script src="{{ asset('js/format.js') }}"></script>
  <script src="{{ asset('js/storage.js') }}"></script>
  <script src="{{ asset('js/supabase.js') }}"></script>
  <script src="{{ asset('js/auth.js') }}"></script>
  <!-- Page JS -->
  <script src="{{ asset('js/profile.js') }}"></script>
  <script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
