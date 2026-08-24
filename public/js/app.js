/* ============================================================
   BudgetKu — App Entry Point
   Detects active page, initializes correct module,
   handles month-change check, sets navbar state.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Muat data dari Supabase
  if (typeof initStorage === 'function') {
    await initStorage();
  }

  // 2. Set bulan aktif di navbar
  updateMonthDisplay();

  // 3. Set active nav link
  setActiveNavLink();

  // 4. Inisialisasi halaman yang aktif
  const page = detectPage();
  switch (page) {
    case 'dashboard':
      if (typeof initDashboard === 'function') initDashboard();
      break;
    case 'budget':
      if (typeof initBudget === 'function') initBudget();
      break;
    case 'tracker':
      if (typeof initTracker === 'function') initTracker();
      break;
    case 'arsip':
      if (typeof initArsip === 'function') initArsip();
      break;
  }

  // 5. Alert jika belum ada setup budget
  if (page === 'dashboard') {
    const budget = getBudget();
    if (!budget || budget.totalBudget === 0) {
      const alertEl = document.getElementById('setup-alert');
      if (alertEl) alertEl.classList.remove('d-none');
    }
  }
});

/**
 * Deteksi halaman berdasarkan filename.
 * @returns {string}
 */
function detectPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('budget')) return 'budget';
  if (path.includes('tracker')) return 'tracker';
  if (path.includes('arsip')) return 'arsip';
  return 'dashboard';
}

/**
 * Set active class pada nav link yang sesuai.
 */
function setActiveNavLink() {
  const page = detectPage();
  const navLinks = document.querySelectorAll('.navbar-budgetku .nav-link');
  navLinks.forEach((link) => {
    link.classList.remove('active');
    const href = link.getAttribute('href') || '';
    if (
      (page === 'dashboard' && (href.includes('dashboard') || href.includes('index') || href === '/' || href === './')) ||
      (page === 'budget' && href.includes('budget')) ||
      (page === 'tracker' && href.includes('tracker')) ||
      (page === 'arsip' && href.includes('arsip'))
    ) {
      link.classList.add('active');
    }
  });
}

/**
 * Update tampilan bulan aktif di navbar.
 */
function updateMonthDisplay() {
  const monthEl = document.getElementById('current-month-display');
  if (monthEl) {
    monthEl.innerHTML = `<i class="bi bi-calendar3"></i> <span>${formatMonth(getCurrentMonth())}</span>`;
  }
}

/**
 * Helper: buat HTML navbar yang konsisten di setiap halaman.
 * Dipanggil dari masing-masing page jika dibutuhkan.
 * @param {string} activePage
 * @returns {string}
 */
function getNavbarHTML(activePage) {
  return `
    <nav class="navbar navbar-expand-md navbar-budgetku fixed-top">
      <div class="container">
        <a class="navbar-brand" href="/dashboard">
          <i class="bi bi-wallet2"></i> BudgetKu
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" href="/dashboard">
                <i class="bi bi-speedometer2"></i> Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${activePage === 'budget' ? 'active' : ''}" href="/budget">
                <i class="bi bi-piggy-bank"></i> Budget
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${activePage === 'tracker' ? 'active' : ''}" href="/tracker">
                <i class="bi bi-journal-text"></i> Tracker
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${activePage === 'arsip' ? 'active' : ''}" href="/arsip">
                <i class="bi bi-archive"></i> Arsip
              </a>
            </li>
          </ul>
          <span class="month-selector" id="current-month-display">
            <i class="bi bi-calendar3"></i> ${formatMonth(getCurrentMonth())}
          </span>
        </div>
      </div>
    </nav>
  `;
}
