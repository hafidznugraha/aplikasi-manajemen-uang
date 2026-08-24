/* ============================================================
   BudgetKu — Forgot Password Module (forgot-password.js)
   Handles sending password recovery link via Supabase Auth.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgot-password-form');
  if (form) {
    form.addEventListener('submit', handleForgotPasswordSubmit);
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
 * Handler Submit Form Lupa Kata Sandi
 */
async function handleForgotPasswordSubmit(e) {
  if (e) e.preventDefault();

  const emailInput = document.getElementById('forgot-email');
  const submitBtn = document.getElementById('btn-forgot-password');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

  if (!email) {
    notifyModal({
      title: 'Email Diperlukan',
      message: 'Harap masukkan alamat email Anda yang terdaftar.',
      type: 'warning',
      onConfirm: () => {
        if (emailInput) emailInput.focus();
      }
    });
    return false;
  }

  // Tampilkan state loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Mengirim Link...';
  }

  try {
    const supabase = typeof getSupabaseClient === 'function' 
      ? getSupabaseClient() 
      : (window.supabaseClient || null);

    // 1. Eksekusi fungsi Supabase Auth dengan redirectTo eksplisit
    if (supabase && supabase.auth) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://127.0.0.1:8000/reset-password.html'
      });

      if (error) {
        throw error;
      }
    } else {
      // Fallback Backend API jika client SDK belum terinisialisasi
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Gagal mengirimkan tautan reset password.');
      }
    }

    // Tampilkan feedback sukses
    notifyModal({
      title: 'Tautan Reset Terkirim!',
      message: `Jika email <strong>${email}</strong> terdaftar, tautan pemulihan kata sandi telah dikirim ke kotak masuk Anda.<br><br>Silakan periksa inbox email atau folder Spam/Promosi Anda.`,
      type: 'info',
      onConfirm: () => {
        if (emailInput) emailInput.value = '';
      }
    });

    if (emailInput) emailInput.value = '';
    return false;
  } catch (err) {
    console.error('Error saat kirim link reset password:', err);
    notifyModal({
      title: 'Koneksi Bermasalah',
      message: 'Terjadi kendala saat mengirimkan tautan reset kata sandi: ' + (err.message || 'Gagal terhubung.'),
      type: 'danger'
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-send-fill"></i> Kirim Link Reset';
    }
  }

  return false;
}

window.handleForgotPasswordSubmit = handleForgotPasswordSubmit;
