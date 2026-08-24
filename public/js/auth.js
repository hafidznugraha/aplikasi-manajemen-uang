/* ============================================================
   BudgetKu — Authentication & Route Guard
   Handles login/register simulation, route protection,
   and user session via localStorage ('budgetku_user').
   ============================================================ */

/**
 * Route Guard: Cek autentikasi secara langsung saat script dieksekusi.
 */
(function checkRouteGuard() {
  const path = window.location.pathname.toLowerCase();
  const isAuthPage = path.includes('login') || path.includes('register');
  const userStr = localStorage.getItem('budgetku_user');

  if (isAuthPage) {
    // Jika sudah login tapi mengakses halaman login/register, arahkan ke dashboard
    if (userStr) {
      const redirectUrl = path.endsWith('.html') ? 'index.html' : '/dashboard';
      window.location.href = redirectUrl;
    }
  } else {
    // Jika belum login dan mengakses halaman aplikasi, paksa redirect ke login
    if (!userStr) {
      const loginUrl = path.endsWith('.html') ? 'login.html' : '/login';
      window.location.href = loginUrl;
    }
  }
})();

/**
 * Event Listener DOMContentLoaded untuk form login, register, dan navbar user
 */
document.addEventListener('DOMContentLoaded', () => {
  initAuthForms();
  updateNavbarUserInfo();
});

/**
 * Inisialisasi event listener untuk form login & register
 */
function initAuthForms() {
  // 1. Form Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = document.getElementById('login-email');
      const email = emailInput ? emailInput.value.trim() : 'user@test.com';
      const name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      const sessionUser = {
        id: 'usr-' + Date.now(),
        name: name || 'User Dummy',
        email: email
      };

      localStorage.setItem('budgetku_user', JSON.stringify(sessionUser));

      const path = window.location.pathname.toLowerCase();
      const redirectUrl = path.endsWith('.html') ? 'index.html' : '/dashboard';
      window.location.href = redirectUrl;
    });
  }

  // 2. Form Register
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('register-name');
      const emailInput = document.getElementById('register-email');
      const passInput = document.getElementById('register-password');
      const passConfirmInput = document.getElementById('register-password-confirm');

      const name = nameInput ? nameInput.value.trim() : 'Pengguna Baru';
      const email = emailInput ? emailInput.value.trim() : 'user@test.com';
      const password = passInput ? passInput.value : '';
      const confirmPassword = passConfirmInput ? passConfirmInput.value : '';

      if (password !== confirmPassword) {
        alert('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
        if (passConfirmInput) passConfirmInput.focus();
        return;
      }

      const sessionUser = {
        id: 'usr-' + Date.now(),
        name: name,
        email: email
      };

      localStorage.setItem('budgetku_user', JSON.stringify(sessionUser));

      const path = window.location.pathname.toLowerCase();
      const redirectUrl = path.endsWith('.html') ? 'index.html' : '/dashboard';
      window.location.href = redirectUrl;
    });
  }
}

/**
 * Update nama & email pengguna di navbar profil jika elemen ada
 */
function updateNavbarUserInfo() {
  const userStr = localStorage.getItem('budgetku_user');
  if (!userStr) return;

  try {
    const user = JSON.parse(userStr);
    const nameEl = document.getElementById('navbar-user-name');
    const emailEl = document.getElementById('navbar-user-email');
    if (nameEl && user.name) nameEl.textContent = user.name;
    if (emailEl && user.email) emailEl.textContent = user.email;
  } catch (e) {
    console.error('Error parsing budgetku_user from localStorage', e);
  }
}

/**
 * Handler Logout: Hapus session dan arahkan kembali ke halaman login
 */
function handleLogout(event) {
  if (event) event.preventDefault();
  localStorage.removeItem('budgetku_user');
  const path = window.location.pathname.toLowerCase();
  const loginUrl = path.endsWith('.html') ? 'login.html' : '/login';
  window.location.href = loginUrl;
}
