<!-- Shared Liquid Glass Navbar -->
<nav class="navbar navbar-expand-md navbar-budgetku fixed-top">
  <div class="container-fluid px-3 px-md-5">
    <a class="navbar-brand" href="{{ route('dashboard.index') }}">
      <span class="brand-icon-box">
        <i class="bi bi-wallet2"></i>
      </span>
      <span>BudgetKu</span>
    </a>
    <button class="navbar-toggler border-0 shadow-none px-2" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="mainNav">
      <ul class="navbar-nav me-auto my-2 my-md-0 gap-1">
        <li class="nav-item">
          <a class="nav-link {{ (request()->is('dashboard*') || request()->is('/') || request()->routeIs('dashboard.index')) ? 'active' : '' }}" {{ (request()->is('dashboard*') || request()->is('/') || request()->routeIs('dashboard.index')) ? 'aria-current=page' : '' }} href="{{ route('dashboard.index') }}">
            <i class="bi bi-speedometer2 me-1"></i> Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link {{ (request()->is('budget*') || request()->routeIs('budget.index')) ? 'active' : '' }}" {{ (request()->is('budget*') || request()->routeIs('budget.index')) ? 'aria-current=page' : '' }} href="{{ route('budget.index') }}">
            <i class="bi bi-piggy-bank me-1"></i> Budget
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link {{ (request()->is('tracker*') || request()->routeIs('tracker.index')) ? 'active' : '' }}" {{ (request()->is('tracker*') || request()->routeIs('tracker.index')) ? 'aria-current=page' : '' }} href="{{ route('tracker.index') }}">
            <i class="bi bi-journal-text me-1"></i> Tracker
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link {{ (request()->is('arsip*') || request()->routeIs('arsip.index')) ? 'active' : '' }}" {{ (request()->is('arsip*') || request()->routeIs('arsip.index')) ? 'aria-current=page' : '' }} href="{{ route('arsip.index') }}">
            <i class="bi bi-archive me-1"></i> Arsip
          </a>
        </li>
      </ul>
      <div class="d-flex align-items-center gap-2 gap-md-3">
        <!-- Month Badge -->
        <span class="month-selector" id="current-month-display">
          <i class="bi bi-calendar3"></i> <span id="month-text"></span>
        </span>

        <!-- Apple Liquid Glass Theme Toggle (Light / Dark) -->
        <button class="btn btn-theme-toggle" id="btn-theme-toggle" type="button" aria-label="Ganti Mode Tema" onclick="toggleTheme()" title="Ganti Mode Tema">
          <i class="bi bi-moon-stars" id="theme-toggle-icon"></i>
        </button>
        
        <!-- User Profile Dropdown & Logout -->
        <div class="dropdown" id="user-profile-dropdown">
          <button class="btn btn-user-pill dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle fs-5" style="color: var(--bk-primary);"></i>
            <span class="fw-semibold text-truncate d-none d-sm-inline" id="navbar-user-name" style="max-width: 120px;">User</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end mt-2 p-2" style="min-width: 220px;">
            <li class="px-3 py-2 mb-1" style="border-bottom: 1px solid var(--bk-border);">
              <p class="text-secondary mb-0" style="font-size: 0.75rem;">Masuk sebagai:</p>
              <p class="fw-bold mb-0 text-truncate" id="navbar-user-email">user@test.com</p>
            </li>
            <li>
              <a class="dropdown-item {{ request()->is('profile*') ? 'active' : '' }} d-flex align-items-center gap-2 py-2" href="{{ url('/profile') }}">
                <i class="bi bi-person-gear"></i> Profil Saya
              </a>
            </li>
            <li><hr class="dropdown-divider my-1"></li>
            <li>
              <a class="dropdown-item text-danger d-flex align-items-center gap-2 py-2" href="#" onclick="handleLogout(event)">
                <i class="bi bi-box-arrow-right"></i> Keluar
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</nav>

<script>
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('budgetku_theme', theme);
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      if (theme === 'dark') {
        icon.className = 'bi bi-sun-fill text-warning';
      } else {
        icon.className = 'bi bi-moon-stars';
      }
    }
    // Dispatch event for components that redraw on theme change (e.g., Chart.js)
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  // Initialize theme from storage or system preference
  (function() {
    const saved = localStorage.getItem('budgetku_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);
  })();
</script>
