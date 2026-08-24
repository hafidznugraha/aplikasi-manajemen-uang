/* ============================================================
   BudgetKu — App Entry Point
   Detects active page, initializes correct module,
   handles month-change check, sets navbar state.
   ============================================================ */

/* ---------- Top Animated Loading Progress Bar Controls ---------- */
function showTopLoader(percent = 70) {
  let loader = document.getElementById('top-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'top-loader';
    document.body.prepend(loader);
  }
  loader.style.opacity = '1';
  loader.style.width = `${percent}%`;
}

function hideTopLoader() {
  const loader = document.getElementById('top-loader');
  if (loader) {
    loader.style.width = '100%';
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.width = '0%';
      }, 350);
    }, 150);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Mulai animasi top loading bar
  showTopLoader(40);

  // 2. Set bulan aktif & active nav link
  updateMonthDisplay();
  setActiveNavLink();

  // 3. Tambahkan click feedback ke semua navbar link
  document.querySelectorAll('.navbar-budgetku .nav-link, .navbar-brand').forEach(link => {
    link.addEventListener('click', (e) => {
      // Tampilkan animasi loading segera saat user klik
      showTopLoader(75);
    });
  });

  // 4. Inisialisasi Storage & Supabase Sync
  showTopLoader(70);
  if (typeof initStorage === 'function') {
    await initStorage();
  }

  // 5. Inisialisasi halaman yang aktif
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

  // 6. Efek fade-in konten halaman
  const mainContent = document.querySelector('main');
  if (mainContent) {
    mainContent.classList.add('page-content-fade');
  }

  // 7. Selesaikan animasi loading
  hideTopLoader();

  // 8. Alert jika belum ada setup budget
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
  if (path.includes('profile')) return 'profile';
  if (path.includes('budget')) return 'budget';
  if (path.includes('tracker')) return 'tracker';
  if (path.includes('arsip')) return 'arsip';
  if (path.includes('login') || path.includes('register')) return 'auth';
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
    link.removeAttribute('aria-current');
    const href = link.getAttribute('href') || '';
    if (
      (page === 'dashboard' && (href.includes('dashboard') || href.includes('index') || href === '/' || href === './')) ||
      (page === 'budget' && href.includes('budget')) ||
      (page === 'tracker' && href.includes('tracker')) ||
      (page === 'arsip' && href.includes('arsip'))
    ) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
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
