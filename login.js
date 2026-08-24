/* ============================================================
   BudgetKu — Login Module (login.js)
   Handles user authentication with secure Bcrypt password verification
   directly against Supabase database and custom modern modals.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
});

/**
 * Helper untuk menampilkan modal notifikasi kustom
 */
function notifyModal(options) {
  if (typeof window.showAppModal === 'function') {
    window.showAppModal(options);
  } else if (typeof showAppModal === 'function') {
    showAppModal(options);
  } else {
    alert(options.message || options);
    if (options.onConfirm) options.onConfirm();
  }
}

/**
 * Handler Form Login Pengguna ke Supabase Database
 */
async function handleLoginSubmit(e) {
  if (e) e.preventDefault();

  const submitBtn = document.querySelector('#login-form button[type="submit"]');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passInput ? passInput.value : '';

  if (!email || !password) {
    notifyModal({
      title: 'Perhatian',
      message: 'Harap masukkan alamat email dan kata sandi Anda.',
      type: 'warning',
      onConfirm: () => {
        if (!email && emailInput) emailInput.focus();
        else if (!password && passInput) passInput.focus();
      }
    });
    return false;
  }

  // Tampilkan state loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Masuk...';
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      notifyModal({
        title: 'Gagal Masuk',
        message: data.message || 'Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.',
        type: 'danger',
        onConfirm: () => {
          if (passInput) passInput.focus();
        }
      });
      return false;
    }

    // Sesi aktif pengguna
    const sessionUser = {
      id: String(data.id),
      name: data.name || email.split('@')[0],
      email: data.email,
    };

    localStorage.setItem('budgetku_user', JSON.stringify(sessionUser));
    sessionStorage.setItem('budgetku_user', JSON.stringify(sessionUser));

    // Redirect ke halaman utama
    const path = window.location.pathname.toLowerCase();
    const redirectUrl = path.endsWith('.html') || path.includes('.html') ? 'index.html' : '/dashboard';
    window.location.href = redirectUrl;
    return false;
  } catch (err) {
    console.error('Error saat login:', err);
    notifyModal({
      title: 'Koneksi Bermasalah',
      message: 'Terjadi kendala saat menghubungi database: ' + (err.message || 'Gagal terhubung ke server.'),
      type: 'danger'
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Masuk';
    }
  }
  return false;
}

window.handleLoginSubmit = handleLoginSubmit;
