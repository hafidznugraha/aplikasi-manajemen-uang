/* ============================================================
   BudgetKu — Reset Password Module (reset-password.js)
   Handles setting a new password via Supabase Auth recovery flow
   with strict error handling and session cleanup.
   ============================================================ */

let recoveryEmail = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Cek apakah tautan memiliki parameter error / expired dari Supabase
  if (checkUrlHashError()) {
    return;
  }

  const form = document.getElementById('reset-password-form');
  if (form) {
    form.addEventListener('submit', handleResetPasswordSubmit);
  }

  initRecoverySession();
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
 * Cek apakah URL hash / fragment mengandung indikasi error token kedaluwarsa
 */
function checkUrlHashError() {
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const combined = (hash + search).toLowerCase();

  const isHtml = window.location.pathname.toLowerCase().endsWith('.html');
  const loginUrl = isHtml ? 'login.html' : '/login';

  if (
    combined.includes('error=') ||
    combined.includes('error_code=otp_expired') ||
    combined.includes('otp_expired') ||
    combined.includes('access_denied')
  ) {
    // Nonaktifkan seluruh input dan tombol form
    const form = document.getElementById('reset-password-form');
    if (form) {
      Array.from(form.elements).forEach(el => el.disabled = true);
    }

    notifyModal({
      title: 'Tautan Tidak Valid',
      message: 'Tautan tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.',
      type: 'danger',
      onConfirm: () => {
        window.location.href = loginUrl;
      }
    });

    // Otomatis redirect setelah 2.5 detik jika popup tidak diklik
    setTimeout(() => {
      window.location.href = loginUrl;
    }, 2500);

    return true;
  }

  return false;
}

/**
 * Inisialisasi sesi pemulihan Supabase dari URL hash/token
 */
async function initRecoverySession() {
  const supabase = window.supabaseClient || (typeof getSupabaseClient === 'function' ? getSupabaseClient() : null);
  if (supabase && supabase.auth) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session && session.user) {
        recoveryEmail = session.user.email;
      }

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session && session.user) {
          recoveryEmail = session.user.email;
        }
      });
    } catch (err) {
      console.warn('Supabase session recovery init:', err);
    }
  }
}

/**
 * Handler Submit Form Reset Kata Sandi Baru dengan Error Handling Tegas
 */
async function handleResetPasswordSubmit(e) {
  if (e) e.preventDefault();

  const newPassInput = document.getElementById('reset-new-password');
  const confirmPassInput = document.getElementById('reset-confirm-password');
  const submitBtn = document.getElementById('btn-reset-password');

  const newPassword = newPassInput ? newPassInput.value.trim() : '';
  const confirmPassword = confirmPassInput ? confirmPassInput.value.trim() : '';

  // 1. Validasi Input: Pastikan tidak kosong / undefined
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
      message: 'Kata sandi minimal harus terdiri dari 6 karakter.',
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
      message: 'Konfirmasi kata sandi tidak cocok. Harap periksa kembali kata sandi yang Anda masukkan.',
      type: 'warning',
      onConfirm: () => {
        if (confirmPassInput) confirmPassInput.focus();
      }
    });
    return false;
  }

  // Tampilkan state loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
  }

  try {
    const supabase = window.supabaseClient || (typeof getSupabaseClient === 'function' ? getSupabaseClient() : null);

    if (!supabase || !supabase.auth) {
      throw new Error('Koneksi Supabase Auth tidak ditemukan. Pastikan halaman terhubung dengan internet.');
    }

    // 2. Eksekusi updateUser dengan Error Handling Tegas
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      // Tampilkan pesan error asli dari Supabase dan HENTIKAN eksekusi
      notifyModal({
        title: 'Gagal Memperbarui Kata Sandi',
        message: error.message || 'Terjadi kesalahan saat memperbarui kata sandi di Supabase.',
        type: 'danger'
      });
      return false;
    }

    // 3. JIKA SUKSES: Sinkronkan update password Bcrypt ke tabel public.users
    const updatedEmail = (data && data.user && data.user.email) ? data.user.email : recoveryEmail;
    try {
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword,
          email: updatedEmail,
        }),
      });
    } catch (apiErr) {
      console.warn('Backend sync warning:', apiErr);
    }

    // 4. Bersihkan sesi recovery Supabase & sesi lokal
    try {
      await supabase.auth.signOut();
    } catch (signOutErr) {
      console.warn('Supabase signOut warning:', signOutErr);
    }
    localStorage.removeItem('budgetku_user');
    sessionStorage.removeItem('budgetku_user');

    const isHtml = window.location.pathname.toLowerCase().endsWith('.html');
    const loginUrl = isHtml ? 'login.html' : '/login';

    // 5. Tampilkan modal SUKSES dan redirect ke login
    notifyModal({
      title: 'Kata Sandi Berhasil Diperbarui!',
      message: 'Kata sandi akun Anda telah berhasil diperbarui. Silakan masuk kembali menggunakan kata sandi baru.',
      type: 'success',
      onConfirm: () => {
        window.location.href = loginUrl;
      }
    });

    // Otomatis redirect setelah 1.5 detik jika popup tidak ditutup manual
    setTimeout(() => {
      window.location.href = loginUrl;
    }, 1500);

    return false;
  } catch (err) {
    console.error('Error saat reset kata sandi:', err);
    notifyModal({
      title: 'Gagal Memperbarui',
      message: err.message || 'Terjadi kendala saat memperbarui kata sandi.',
      type: 'danger'
    });
    return false;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Simpan Kata Sandi';
    }
  }
}

window.handleResetPasswordSubmit = handleResetPasswordSubmit;
window.checkUrlHashError = checkUrlHashError;
