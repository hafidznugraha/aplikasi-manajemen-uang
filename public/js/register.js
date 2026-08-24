/* ============================================================
   BudgetKu — Register Module with 8-Digit Email OTP Verification
   Handles multi-step registration:
   Step 1: Input user details & send 8-digit OTP to real email
   Step 2: Interactive 8-digit OTP verification with countdown timer
   ============================================================ */

let pendingRegistration = null;
let resendTimerInterval = null;
let resendCooldownSeconds = 60;
let isVerifyingOtp = false;

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }

  const otpVerifyForm = document.getElementById('otp-verify-form');
  if (otpVerifyForm) {
    otpVerifyForm.addEventListener('submit', handleOtpVerifySubmit);
  }

  setupOtpInputHandlers();
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
 * STEP 1: Handler Kirim OTP Pendaftaran ke Email Asli
 */
async function handleRegisterSubmit(e) {
  if (e) e.preventDefault();

  const submitBtn = document.querySelector('#register-form button[type="submit"]');
  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const passInput = document.getElementById('register-password');
  const passConfirmInput = document.getElementById('register-password-confirm');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passInput ? passInput.value : '';
  const confirmPassword = passConfirmInput ? passConfirmInput.value : '';

  // 1. Validasi form
  if (!name || !email || !password || !confirmPassword) {
    notifyModal({
      title: 'Form Belum Lengkap',
      message: 'Harap isi semua kolom pendaftaran dengan benar.',
      type: 'warning',
      onConfirm: () => {
        if (!name && nameInput) nameInput.focus();
        else if (!email && emailInput) emailInput.focus();
        else if (!password && passInput) passInput.focus();
      }
    });
    return false;
  }

  if (password !== confirmPassword) {
    notifyModal({
      title: 'Kata Sandi Tidak Cocok',
      message: 'Konfirmasi kata sandi tidak cocok. Harap periksa kembali kata sandi yang Anda masukkan.',
      type: 'warning',
      onConfirm: () => {
        if (passConfirmInput) passConfirmInput.focus();
      }
    });
    return false;
  }

  if (password.length < 6) {
    notifyModal({
      title: 'Kata Sandi Terlalu Pendek',
      message: 'Kata sandi minimal harus terdiri dari 6 karakter.',
      type: 'warning',
      onConfirm: () => {
        if (passInput) passInput.focus();
      }
    });
    return false;
  }

  // Tampilkan state loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Mengirim ke Email...';
  }

  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data.message || 'Gagal mengirimkan kode OTP.';
      const isDuplicate = errMsg.includes('sudah terdaftar') || errMsg.includes('duplicate key') || errMsg.includes('unique');

      if (isDuplicate) {
        notifyModal({
          title: 'Email Sudah Terdaftar',
          message: 'Alamat email ini sudah terdaftar di database. Silakan gunakan email lain atau langsung masuk ke akun Anda.',
          type: 'warning',
          onConfirm: () => {
            if (emailInput) emailInput.focus();
          }
        });
      } else {
        notifyModal({
          title: 'Pendaftaran Gagal',
          message: errMsg,
          type: 'danger'
        });
      }
      return false;
    }

    // Simpan data pendaftaran sementara
    pendingRegistration = { name, email, password };

    // Pindah ke STEP 2 (Verifikasi OTP 8-Digit)
    goToStep2(email);
    return false;
  } catch (err) {
    console.error('Error saat kirim OTP:', err);
    notifyModal({
      title: 'Koneksi Bermasalah',
      message: 'Terjadi kendala saat menghubungi server: ' + (err.message || 'Gagal terhubung.'),
      type: 'danger'
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-envelope-arrow-up"></i> Daftar & Dapatkan OTP';
    }
  }
  return false;
}

/**
 * Berpindah ke Step 2 (Verifikasi OTP)
 */
function goToStep2(email) {
  const step1 = document.getElementById('register-step-1');
  const step2 = document.getElementById('register-step-2');
  const emailBadge = document.getElementById('otp-target-email-badge');

  if (step1 && step2) {
    step1.classList.add('d-none');
    step2.classList.remove('d-none');
  }

  if (emailBadge) {
    emailBadge.textContent = email;
  }

  // Reset flag
  isVerifyingOtp = false;

  // Reset input kotak OTP
  const inputs = document.querySelectorAll('.otp-digit');
  inputs.forEach(input => {
    input.value = '';
    input.disabled = false;
  });

  if (inputs.length > 0) {
    setTimeout(() => inputs[0].focus(), 150);
  }

  // Mulai hitung mundur kirim ulang
  startResendCountdown();

  // Pemberitahuan bahwa email OTP telah terkirim ke Inbox asli
  notifyModal({
    title: 'Kode OTP Terkirim!',
    message: `Kode verifikasi 8-digit telah dikirim ke kotak masuk email <strong>${email}</strong>.<br><br>Silakan buka inbox email (atau folder Spam/Promosi) Anda untuk melihat kode OTP.`,
    type: 'info'
  });
}

/**
 * Kembali ke Step 1 (Ubah Data / Edit Form)
 */
function goToStep1() {
  const step1 = document.getElementById('register-step-1');
  const step2 = document.getElementById('register-step-2');

  if (step1 && step2) {
    step2.classList.add('d-none');
    step1.classList.remove('d-none');
  }

  if (resendTimerInterval) {
    clearInterval(resendTimerInterval);
    resendTimerInterval = null;
  }
  isVerifyingOtp = false;
}

/**
 * STEP 2: Handler Submit Verifikasi OTP (8 Digit)
 */
async function handleOtpVerifySubmit(e) {
  if (e) e.preventDefault();

  // Cegah eksekusi ganda bersamaan
  if (isVerifyingOtp) return false;

  if (!pendingRegistration || !pendingRegistration.email) {
    notifyModal({
      title: 'Sesi Kadaluarsa',
      message: 'Sesi pendaftaran Anda telah berakhir. Silakan isi kembali formulir pendaftaran.',
      type: 'warning',
      onConfirm: () => goToStep1()
    });
    return false;
  }

  const inputs = Array.from(document.querySelectorAll('.otp-digit'));
  const otp = inputs.map(i => i.value.trim()).join('');

  if (otp.length !== inputs.length) {
    notifyModal({
      title: 'Kode OTP Belum Lengkap',
      message: `Harap masukkan seluruh ${inputs.length} digit kode OTP yang diterima di email.`,
      type: 'warning',
      onConfirm: () => {
        const emptyInput = inputs.find(i => !i.value);
        if (emptyInput) emptyInput.focus();
      }
    });
    return false;
  }

  // Kunci eksekusi
  isVerifyingOtp = true;

  const submitBtn = document.getElementById('btn-verify-otp');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Memverifikasi...';
  }

  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: pendingRegistration.email,
        otp: otp,
      }),
    });

    const data = await res.json().catch(() => ({}));

    // 1. BLOK JIKA GAGAL / ERROR
    if (!res.ok) {
      isVerifyingOtp = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Verifikasi & Buat Akun';
      }

      notifyModal({
        title: 'Verifikasi Gagal',
        message: data.message || 'Kode OTP salah atau telah kadaluarsa. Silakan periksa kembali email Anda.',
        type: 'danger',
        onConfirm: () => {
          inputs.forEach(i => i.value = '');
          if (inputs[0]) inputs[0].focus();
        }
      });
      return false;
    }

    // 2. BLOK SUKSES
    // Hentikan timer countdown hitung mundur secara permanen
    if (resendTimerInterval) {
      clearInterval(resendTimerInterval);
      resendTimerInterval = null;
    }

    // Nonaktifkan seluruh input OTP agar tidak bisa diubah lagi
    inputs.forEach(i => i.disabled = true);

    // Simpan sesi user aktif ke localStorage & sessionStorage
    const sessionUser = {
      id: String(data.id || (data.user && data.user.id) || ''),
      name: data.name || (data.user && data.user.name) || pendingRegistration.name,
      email: data.email || (data.user && data.user.email) || pendingRegistration.email,
    };
    localStorage.setItem('budgetku_user', JSON.stringify(sessionUser));
    sessionStorage.setItem('budgetku_user', JSON.stringify(sessionUser));

    // Tampilkan modal notifikasi sukses
    notifyModal({
      title: 'Pendaftaran Berhasil!',
      message: `Selamat datang di BudgetKu, <strong>${sessionUser.name}</strong>! Akun Anda telah aktif.`,
      type: 'success',
      onConfirm: () => {
        const path = window.location.pathname.toLowerCase();
        const redirectUrl = path.endsWith('.html') || path.includes('.html') ? 'index.html' : '/dashboard';
        window.location.href = redirectUrl;
      }
    });

    // Berikan jeda 800ms sebelum auto-redirect mulus ke Dashboard
    setTimeout(() => {
      const path = window.location.pathname.toLowerCase();
      const redirectUrl = path.endsWith('.html') || path.includes('.html') ? 'index.html' : '/dashboard';
      window.location.href = redirectUrl;
    }, 800);

    return; // Hentikan fungsi seutuhnya
  } catch (err) {
    isVerifyingOtp = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Verifikasi & Buat Akun';
    }
    console.error('Error saat verifikasi OTP:', err);
    notifyModal({
      title: 'Koneksi Bermasalah',
      message: 'Terjadi kendala saat memverifikasi kode: ' + (err.message || 'Gagal terhubung.'),
      type: 'danger'
    });
    return false;
  }
}

/**
 * Handler Kirim Ulang Kode OTP
 */
async function handleResendOtp() {
  if (!pendingRegistration || !pendingRegistration.email) {
    goToStep1();
    return;
  }

  const resendBtn = document.getElementById('btn-resend-otp');
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Mengirim...';
  }

  try {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: pendingRegistration.email,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      notifyModal({
        title: 'Gagal Mengirim Ulang',
        message: data.message || 'Tidak dapat mengirim ulang kode saat ini.',
        type: 'warning'
      });
      return;
    }

    startResendCountdown();

    notifyModal({
      title: 'Kode OTP Baru Dikirim!',
      message: `Kode OTP baru telah dikirimkan ke kotak masuk email <strong>${pendingRegistration.email}</strong>.`,
      type: 'info'
    });

    // Reset kotak OTP dan fokus
    const inputs = document.querySelectorAll('.otp-digit');
    inputs.forEach(i => i.value = '');
    if (inputs.length > 0) inputs[0].focus();
  } catch (err) {
    notifyModal({
      title: 'Koneksi Bermasalah',
      message: 'Terjadi kendala saat mengirim ulang kode: ' + (err.message || 'Gagal terhubung.'),
      type: 'danger'
    });
  } finally {
    if (resendBtn) {
      resendBtn.disabled = false;
      resendBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Kirim Ulang Kode OTP';
    }
  }
}

/**
 * Hitung Mundur 60 Detik untuk Kirim Ulang OTP
 */
function startResendCountdown() {
  if (resendTimerInterval) {
    clearInterval(resendTimerInterval);
  }

  let remaining = resendCooldownSeconds;
  const timerText = document.getElementById('otp-timer-text');
  const timerCount = document.getElementById('otp-timer-count');
  const resendBtn = document.getElementById('btn-resend-otp');

  if (timerText) timerText.classList.remove('d-none');
  if (resendBtn) resendBtn.classList.add('d-none');

  const updateDisplay = () => {
    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    if (timerCount) timerCount.textContent = `${mins}:${secs}`;
  };

  updateDisplay();

  resendTimerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(resendTimerInterval);
      resendTimerInterval = null;
      if (timerText) timerText.classList.add('d-none');
      if (resendBtn) resendBtn.classList.remove('d-none');
    } else {
      updateDisplay();
    }
  }, 1000);
}

/**
 * Setup Interaksi Input OTP 8-Digit (Auto-jump, Paste, Arrow Keys, Backspace)
 */
function setupOtpInputHandlers() {
  const inputs = Array.from(document.querySelectorAll('.otp-digit'));
  if (inputs.length === 0) return;

  inputs.forEach((input, idx) => {
    // 1. Handle Input (Karakter masuk)
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      // Hanya izinkan angka
      if (!/^\d*$/.test(val)) {
        e.target.value = val.replace(/\D/g, '');
        return;
      }

      if (val.length === 1 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
        inputs[idx + 1].select();
      }
    });

    // 2. Handle Keydown (Backspace & Navigasi Panah)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!input.value && idx > 0) {
          inputs[idx - 1].focus();
          inputs[idx - 1].value = '';
        }
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        inputs[idx - 1].focus();
      } else if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }
    });

    // 3. Handle Paste (Tempel Kode 8 Digit Sekaligus)
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedData = (e.clipboardData || window.clipboardData).getData('text').trim();
      const digits = pastedData.replace(/\D/g, '').slice(0, inputs.length);

      if (digits.length > 0) {
        digits.split('').forEach((d, i) => {
          if (inputs[i]) {
            inputs[i].value = d;
          }
        });

        const nextIndex = Math.min(digits.length, inputs.length - 1);
        if (inputs[nextIndex]) {
          inputs[nextIndex].focus();
        }

        // Jika lengkap 8 digit dan belum diproses, submit form
        if (digits.length === inputs.length && !isVerifyingOtp) {
          setTimeout(() => {
            const verifyForm = document.getElementById('otp-verify-form');
            if (verifyForm && !isVerifyingOtp) {
              handleOtpVerifySubmit();
            }
          }, 200);
        }
      }
    });
  });
}

// Ekspor fungsi global untuk event onclick di HTML
window.handleRegisterSubmit = handleRegisterSubmit;
window.handleOtpVerifySubmit = handleOtpVerifySubmit;
window.handleResendOtp = handleResendOtp;
window.goToStep1 = goToStep1;
window.goToStep2 = goToStep2;
