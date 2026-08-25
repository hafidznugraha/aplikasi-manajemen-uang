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
          <a class="nav-link {{ (request()->is('dashboard*') || request()->is('/') || request()->routeIs('dashboard.index')) ? 'active' : '' }}" {{ (request()->is('dashboard*') || request()->is('/') || request()->routeIs('dashboard.index')) ? 'aria-current=page' : '' }} href="{{ route('dashboard.index') }}">
            <i class="bi bi-speedometer2"></i> Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link {{ (request()->is('budget*') || request()->routeIs('budget.index')) ? 'active' : '' }}" {{ (request()->is('budget*') || request()->routeIs('budget.index')) ? 'aria-current=page' : '' }} href="{{ route('budget.index') }}">
            <i class="bi bi-piggy-bank"></i> Budget
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link {{ (request()->is('tracker*') || request()->routeIs('tracker.index')) ? 'active' : '' }}" {{ (request()->is('tracker*') || request()->routeIs('tracker.index')) ? 'aria-current=page' : '' }} href="{{ route('tracker.index') }}">
            <i class="bi bi-journal-text"></i> Tracker
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link {{ (request()->is('arsip*') || request()->routeIs('arsip.index')) ? 'active' : '' }}" {{ (request()->is('arsip*') || request()->routeIs('arsip.index')) ? 'aria-current=page' : '' }} href="{{ route('arsip.index') }}">
            <i class="bi bi-archive"></i> Arsip
          </a>
        </li>
      </ul>
      <div class="d-flex align-items-center gap-2 gap-md-3">
        <span class="month-selector" id="current-month-display">
          <i class="bi bi-calendar3"></i> <span id="month-text"></span>
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
              <a class="dropdown-item {{ request()->is('profile*') ? 'active' : '' }} rounded-2 d-flex align-items-center gap-2 py-2 text-dark" href="{{ url('/profile') }}">
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
