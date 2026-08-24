/* ============================================================
   BudgetKu — Authentication & Route Guard
   Handles Supabase Database direct authentication,
   active session ('budgetku_user'), and route protection.
   ============================================================ */

/**
 * Route Guard: Cek status login pengguna saat halaman dibuka
 */
(function checkRouteGuard() {
  const path = window.location.pathname.toLowerCase();
  
  // Whitelist seluruh halaman publik / autentikasi & pemulihan kata sandi
  const isAuthPage = 
    path.includes('login') || 
    path.includes('register') || 
    path.includes('forgot-password') || 
    path.includes('reset-password');
    
  const userStr = localStorage.getItem('budgetku_user') || sessionStorage.getItem('budgetku_user');

  if (isAuthPage) {
    // Jika sudah login dan mencoba akses halaman auth publik (kecuali reset-password), arahkan ke dashboard
    if (userStr && !path.includes('reset-password')) {
      const redirectUrl = path.endsWith('.html') || path.includes('.html') ? 'index.html' : '/dashboard';
      window.location.href = redirectUrl;
    }
  } else {
    // Jika belum login dan mengakses halaman internal app, paksa redirect ke login
    if (!userStr) {
      const loginUrl = path.endsWith('.html') || path.includes('.html') ? 'login.html' : '/login';
      window.location.href = loginUrl;
    }
  }
})();

/**
 * Event Listener DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
  updateNavbarUserInfo();
});

/**
 * Update nama & email pengguna di navbar profil jika elemen ada
 */
function updateNavbarUserInfo() {
  const userStr = localStorage.getItem('budgetku_user') || sessionStorage.getItem('budgetku_user');
  if (!userStr) return;

  try {
    const user = JSON.parse(userStr);
    const nameEl = document.getElementById('navbar-user-name');
    const emailEl = document.getElementById('navbar-user-email');
    if (nameEl && user.name) nameEl.textContent = user.name;
    if (emailEl && user.email) emailEl.textContent = user.email;
  } catch (e) {
    console.error('Error parsing user session', e);
  }
}

/**
 * Handler Logout: Hapus session dan arahkan kembali ke halaman login
 */
function handleLogout(event) {
  if (event) event.preventDefault();
  localStorage.removeItem('budgetku_user');
  sessionStorage.removeItem('budgetku_user');
  const path = window.location.pathname.toLowerCase();
  const loginUrl = path.endsWith('.html') || path.includes('.html') ? 'login.html' : '/login';
  window.location.href = loginUrl;
}

window.handleLogout = handleLogout;
