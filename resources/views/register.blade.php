<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daftar Akun - BudgetKu</title>
  
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

  <div class="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5">
    <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white" style="max-width: 460px; width: 100%;">
      
      <!-- Brand Header -->
      <div class="text-center mb-4">
        <div class="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style="width: 56px; height: 56px;">
          <i class="bi bi-wallet2 fs-3"></i>
        </div>
        <h3 class="fw-bold text-dark mb-1">BudgetKu</h3>
        <p class="text-muted small mb-0">Buat akun baru untuk mulai mencatat keuangan</p>
      </div>

      <!-- Register Form -->
      <form id="register-form">
        <!-- Full Name Input -->
        <div class="mb-3">
          <label for="register-name" class="form-label fw-medium text-dark small">Nama Lengkap</label>
          <div class="input-group">
            <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-person"></i></span>
            <input type="text" class="form-control border-start-0 ps-0" id="register-name" placeholder="John Doe" required autocomplete="name">
          </div>
        </div>

        <!-- Email Input -->
        <div class="mb-3">
          <label for="register-email" class="form-label fw-medium text-dark small">Alamat Email</label>
          <div class="input-group">
            <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-envelope"></i></span>
            <input type="email" class="form-control border-start-0 ps-0" id="register-email" placeholder="nama@email.com" required autocomplete="email">
          </div>
        </div>

        <!-- Password Input -->
        <div class="mb-3">
          <label for="register-password" class="form-label fw-medium text-dark small">Kata Sandi</label>
          <div class="input-group">
            <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-lock"></i></span>
            <input type="password" class="form-control border-start-0 ps-0" id="register-password" placeholder="Minimal 6 karakter" required minlength="6" autocomplete="new-password">
          </div>
        </div>

        <!-- Password Confirmation Input -->
        <div class="mb-4">
          <label for="register-password-confirm" class="form-label fw-medium text-dark small">Konfirmasi Kata Sandi</label>
          <div class="input-group">
            <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-shield-check"></i></span>
            <input type="password" class="form-control border-start-0 ps-0" id="register-password-confirm" placeholder="Ulangi kata sandi" required minlength="6" autocomplete="new-password">
          </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2">
          <i class="bi bi-person-plus"></i> Daftar
        </button>
      </form>

      <!-- Login Link -->
      <div class="text-center mt-4 pt-2 border-top">
        <p class="text-muted small mb-0">
          Sudah punya akun? <a href="{{ url('/login') }}" class="text-primary fw-semibold text-decoration-none">Masuk di sini</a>
        </p>
      </div>

    </div>
  </div>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <!-- Auth JS -->
  <script src="{{ asset('js/auth.js') }}"></script>
</body>
</html>
