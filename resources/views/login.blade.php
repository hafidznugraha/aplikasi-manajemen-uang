<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Masuk - BudgetKu</title>
  
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <!-- Google Fonts: Inter -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Custom CSS -->
  <link href="{{ asset('css/style.css') }}" rel="stylesheet">
  <script>
    (function() {
      const saved = localStorage.getItem('budgetku_theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
    })();
  </script>
</head>
<body class="auth-page d-flex align-items-center justify-content-center min-vh-100 p-3">

  <div class="card card-budgetku p-4 p-md-5 w-100" style="max-width: 420px;">
    <!-- Brand Header -->
    <div class="text-center mb-4">
      <div class="d-inline-flex align-items-center justify-content-center rounded-4 mb-3" style="width: 58px; height: 58px; background: linear-gradient(135deg, var(--bk-primary), #004fb0); color: #ffffff; box-shadow: 0 4px 16px var(--bk-primary-glow);">
        <i class="bi bi-wallet2 fs-3"></i>
      </div>
      <h3 class="fw-bold mb-1">BudgetKu</h3>
      <p class="text-secondary small mb-0">Masuk ke akun Anda untuk mengelola keuangan</p>
    </div>

    <!-- Login Form -->
    <form id="login-form" onsubmit="return handleLoginSubmit(event);">
      <!-- Email Input -->
      <div class="mb-3">
        <label for="login-email" class="form-label fw-medium small">Alamat Email</label>
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-envelope"></i></span>
          <input type="email" class="form-control" id="login-email" placeholder="nama@email.com" required autocomplete="email">
        </div>
      </div>

      <!-- Password Input -->
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <label for="login-password" class="form-label fw-medium small mb-0">Kata Sandi</label>
          <a href="{{ url('/forgot-password') }}" class="text-primary small text-decoration-none fw-medium">Lupa sandi?</a>
        </div>
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-lock"></i></span>
          <input type="password" class="form-control" id="login-password" placeholder="••••••••" required autocomplete="current-password">
        </div>
      </div>

      <!-- Remember Me Checkbox -->
      <div class="mb-4 form-check">
        <input type="checkbox" class="form-check-input" id="remember-me">
        <label class="form-check-label text-secondary small" for="remember-me">Ingat saya di perangkat ini</label>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2">
        <i class="bi bi-box-arrow-in-right"></i> Masuk
      </button>
    </form>

    <!-- Register Link -->
    <div class="text-center mt-4 pt-3 border-top" style="border-color: var(--bk-border);">
      <p class="text-secondary small mb-0">
        Belum punya akun? <a href="{{ url('/register') }}" class="text-primary fw-semibold text-decoration-none">Daftar sekarang</a>
      </p>
    </div>
  </div>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <!-- Modal Alert & Supabase JS SDK -->
  <script src="{{ asset('js/modal-alert.js') }}"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <!-- Supabase Connection & Auth JS -->
  <script src="{{ asset('js/supabase.js') }}"></script>
  <script src="{{ asset('js/auth.js') }}"></script>
  <script src="{{ asset('js/login.js') }}"></script>
</body>
</html>
