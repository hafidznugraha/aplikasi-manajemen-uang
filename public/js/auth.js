/* ============================================================
   BudgetKu — Authentication & Route Guard
   Handles registered user database ('budgetku_users'),
   active session ('budgetku_user'), and route protection.
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
      const redirectUrl = path.endsWith('.html') || path.includes('.html') ? 'index.html' : '/dashboard';
      window.location.href = redirectUrl;
    }
  } else {
    // Jika belum login dan mengakses halaman aplikasi, paksa redirect ke login
    if (!userStr) {
      const loginUrl = path.endsWith('.html') || path.includes('.html') ? 'login.html' : '/login';
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
 * Ambil seluruh daftar pengguna yang terdaftar dari localStorage ('budgetku_users')
 * @returns {Array}
 */
function getRegisteredUsers() {
  try {
    const usersStr = localStorage.getItem('budgetku_users');
    if (usersStr) {
      const parsed = JSON.parse(usersStr);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

/**
 * Simpan daftar pengguna ke localStorage
 * @param {Array} users
 */
function saveRegisteredUsers(users) {
  try {
    localStorage.setItem('budgetku_users', JSON.stringify(users));
  } catch (e) {}
}

/**
 * Handler Submit Form Registrasi
 */
function handleRegisterSubmit(e) {
  if (e) e.preventDefault();

  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const passInput = document.getElementById('register-password');
  const passConfirmInput = document.getElementById('register-password-confirm');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const confirmPassword = passConfirmInput ? passConfirmInput.value : '';

  // 1. Validasi field tidak kosong
  if (!name || !email || !password || !confirmPassword) {
    alert('Harap lengkapi semua kolom pendaftaran.');
    return false;
  }

  // 2. Validasi kecocokan password
  if (password !== confirmPassword) {
    alert('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
    if (passConfirmInput) passConfirmInput.focus();
    return false;
  }

  // 3. Cek apakah email sudah terdaftar di budgetku_users
  const users = getRegisteredUsers();
  const emailExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());

  if (emailExists) {
    alert('Email sudah terdaftar! Silakan gunakan email lain atau masuk ke akun Anda.');
    if (emailInput) emailInput.focus();
    return false;
  }

  // 4. Buat objek user baru
  const newUser = {
    id: 'usr_' + Date.now(),
    name: name,
    email: email,
    password: password,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveRegisteredUsers(users);

  // 5. Auto-Login: Buat sesi aktif di budgetku_user
  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email
  };
  localStorage.setItem('budgetku_user', JSON.stringify(sessionUser));

  // 6. Redirect ke halaman utama
  const path = window.location.pathname.toLowerCase();
  const redirectUrl = path.endsWith('.html') || path.includes('.html') ? 'index.html' : '/dashboard';
  window.location.href = redirectUrl;
  return false;
}

/**
 * Handler Submit Form Login
 */
function handleLoginSubmit(e) {
  if (e) e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';

  if (!email || !password) {
    alert('Harap masukkan email dan kata sandi.');
    return false;
  }

  const users = getRegisteredUsers();
  const foundUser = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

  if (foundUser) {
    if (foundUser.password && foundUser.password !== password) {
      alert('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
      if (passInput) passInput.focus();
      return false;
    }

    const sessionUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email
    };
    localStorage.setItem('budgetku_user', JSON.stringify(sessionUser));
  } else {
    // Jika belum ada user terdaftar (contoh demo user baru)
    const newUser = {
      id: 'usr_' + Date.now(),
      name: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: email,
      password: password,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveRegisteredUsers(users);

    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    };
    localStorage.setItem('budgetku_user', JSON.stringify(sessionUser));
  }

  const path = window.location.pathname.toLowerCase();
  const redirectUrl = path.endsWith('.html') || path.includes('.html') ? 'index.html' : '/dashboard';
  window.location.href = redirectUrl;
  return false;
}

// Expose handlers globally
window.handleRegisterSubmit = handleRegisterSubmit;
window.handleLoginSubmit = handleLoginSubmit;
window.getRegisteredUsers = getRegisteredUsers;

/**
 * Inisialisasi event listener form
 */
function initAuthForms() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
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
  const loginUrl = path.endsWith('.html') || path.includes('.html') ? 'login.html' : '/login';
  window.location.href = loginUrl;
}
