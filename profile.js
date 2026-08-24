/* ============================================================
   BudgetKu — Profile Module (profile.js)
   Handles user profile information display and secure password
   update via Supabase Database / Backend API.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initProfilePage();

  const passwordForm = document.getElementById('profile-password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', handleUpdatePassword);
  }
});

/**
 * Helper untuk memanggil modal notifikasi kustom
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
 * Inisialisasi Halaman Profil & Muat Data Pengguna Aktif
 */
async function initProfilePage() {
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const cardUserName = document.getElementById('card-user-name');

  // 1. Ambil dari session storage / localStorage
  let activeUser = null;
  if (typeof getActiveUser === 'function') {
    activeUser = getActiveUser();
  } else {
    const raw = localStorage.getItem('budgetku_user') || sessionStorage.getItem('budgetku_user');
    if (raw) {
      try { activeUser = JSON.parse(raw); } catch (e) {}
    }
  }

  // 2. Jika Supabase client tersedia, coba ambil data user terkini
  if (typeof getSupabaseClient === 'function') {
    try {
      const client = getSupabaseClient();
      if (client && client.auth) {
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          const userMeta = user.user_metadata || {};
          if (!activeUser) activeUser = {};
          activeUser.email = user.email || activeUser.email;
          activeUser.name = userMeta.full_name || userMeta.name || activeUser.name || user.email.split('@')[0];
        }
      }
    } catch (err) {
      console.warn('Gagal membaca data dari Supabase auth client:', err);
    }
  }

  if (activeUser) {
    const displayName = activeUser.name || 'Pengguna BudgetKu';
    const displayEmail = activeUser.email || '-';

    if (nameInput) nameInput.value = displayName;
    if (emailInput) emailInput.value = displayEmail;
    if (cardUserName) cardUserName.textContent = displayName;
  }
}

/**
 * Handler Simpan / Update Kata Sandi Baru
 */
async function handleUpdatePassword(e) {
  if (e) e.preventDefault();

  const newPassInput = document.getElementById('new-password');
  const confirmPassInput = document.getElementById('confirm-password');
  const submitBtn = document.getElementById('btn-save-password');

  const newPassword = newPassInput ? newPassInput.value : '';
  const confirmPassword = confirmPassInput ? confirmPassInput.value : '';

  // 1. Validasi
  if (!newPassword || !confirmPassword) {
    notifyModal({
      title: 'Form Belum Lengkap',
      message: 'Harap isi kata sandi baru dan konfirmasi kata sandi.',
      type: 'warning',
      onConfirm: () => {
        if (!newPassword && newPassInput) newPassInput.focus();
        else if (confirmPassInput) confirmPassInput.focus();
      }
    });
    return false;
  }

  if (newPassword.length < 6) {
    notifyModal({
      title: 'Kata Sandi Terlalu Pendek',
      message: 'Kata sandi baru minimal harus terdiri dari 6 karakter.',
      type: 'warning',
      onConfirm: () => {
        if (newPassInput) newPassInput.focus();
      }
    });
    return false;
  }

  if (newPassword !== confirmPassword) {
    notifyModal({
      title: 'Kata Sandi Tidak Cocok',
      message: 'Konfirmasi kata sandi baru tidak cocok. Harap periksa kembali.',
      type: 'warning',
      onConfirm: () => {
        if (confirmPassInput) confirmPassInput.focus();
      }
    });
    return false;
  }

  // Ambil data user aktif
  let activeUser = null;
  if (typeof getActiveUser === 'function') {
    activeUser = getActiveUser();
  } else {
    const raw = localStorage.getItem('budgetku_user') || sessionStorage.getItem('budgetku_user');
    if (raw) {
      try { activeUser = JSON.parse(raw); } catch (e) {}
    }
  }

  // Tampilkan state loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
  }

  try {
    let updateSuccess = false;

    // 2. Update via Supabase Client jika aktif
    if (typeof getSupabaseClient === 'function') {
      try {
        const client = getSupabaseClient();
        if (client && client.auth) {
          const { error } = await client.auth.updateUser({ password: newPassword });
          if (!error) updateSuccess = true;
        }
      } catch (e) {
        console.warn('Supabase auth client update bypass:', e);
      }
    }

    // 3. Update via Backend API (Menghash kata sandi dengan Bcrypt di public.users)
    const res = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        password: newPassword,
        user_id: activeUser ? activeUser.id : null,
        email: activeUser ? activeUser.email : null,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok && !updateSuccess) {
      throw new Error(data.message || 'Gagal memperbarui kata sandi di database.');
    }

    // Sukses: Bersihkan input form
    if (newPassInput) newPassInput.value = '';
    if (confirmPassInput) confirmPassInput.value = '';

    notifyModal({
      title: 'Berhasil',
      message: 'Kata sandi berhasil diperbarui!',
      type: 'success'
    });

    return false;
  } catch (err) {
    console.error('Error saat update kata sandi:', err);
    notifyModal({
      title: 'Gagal Memperbarui',
      message: err.message || 'Terjadi kendala saat memperbarui kata sandi.',
      type: 'danger'
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Simpan Kata Sandi';
    }
  }

  return false;
}

window.handleUpdatePassword = handleUpdatePassword;
window.initProfilePage = initProfilePage;
