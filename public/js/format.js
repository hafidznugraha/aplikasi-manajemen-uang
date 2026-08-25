/* ============================================================
   BudgetKu — Format & Utility Helpers
   ============================================================ */

/**
 * Format angka menjadi format Rupiah.
 * @param {number} amount - Jumlah angka.
 * @returns {string} Contoh: "Rp 1.500.000"
 */
function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('id-ID');
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format angka menjadi format Rupiah ringkas (ribuan/jutaan).
 * @param {number} amount
 * @returns {string} Contoh: "Rp 1,5jt" atau "Rp 500rb"
 */
function formatRupiahShort(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1000000) {
    const val = (abs / 1000000).toFixed(1).replace('.0', '');
    return `${sign}Rp ${val}jt`;
  }
  if (abs >= 1000) {
    const val = (abs / 1000).toFixed(0);
    return `${sign}Rp ${val}rb`;
  }
  return `${sign}Rp ${abs}`;
}

/**
 * Parse string Rupiah menjadi angka.
 * Menerima format: "1.500.000", "1500000", "Rp 1.500.000"
 * @param {string} str
 * @returns {number}
 */
function parseRupiah(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9-]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Format input angka saat user mengetik (auto-separator ribuan).
 * @param {HTMLInputElement} input
 */
function formatInputRupiah(input) {
  let value = input.value.replace(/[^0-9]/g, '');
  if (value === '') {
    input.value = '';
    return;
  }
  const num = parseInt(value, 10);
  input.value = num.toLocaleString('id-ID');
}

/**
 * Format tanggal ke format Indonesia.
 * @param {string|Date} dateStr - ISO date string atau Date object.
 * @returns {string} Contoh: "24 Agustus 2026"
 */
function formatDateLong(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format tanggal ke format pendek.
 * @param {string|Date} dateStr
 * @returns {string} Contoh: "24/08/2026"
 */
function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format bulan dan tahun saja.
 * @param {string} monthStr - Format "YYYY-MM"
 * @returns {string} Contoh: "Agustus 2026"
 */
function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Dapatkan bulan aktif saat ini dalam format "YYYY-MM".
 * @returns {string}
 */
function getCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Dapatkan bulan sebelumnya dari format "YYYY-MM".
 * @param {string} [monthStr] - Format "YYYY-MM" (default: bulan saat ini)
 * @returns {string} Format "YYYY-MM" bulan sebelumnya
 */
function getPreviousMonth(monthStr) {
  const target = monthStr || getCurrentMonth();
  const [yearStr, monthNumStr] = target.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthNumStr, 10);
  const prevDate = new Date(y, m - 2, 1);
  const prevY = prevDate.getFullYear();
  const prevM = String(prevDate.getMonth() + 1).padStart(2, '0');
  return `${prevY}-${prevM}`;
}

window.getPreviousMonth = getPreviousMonth;

/**
 * Dapatkan tanggal hari ini dalam format "YYYY-MM-DD".
 * @returns {string}
 */
function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generate unique ID.
 * @param {string} prefix - Prefix, misal "cat", "sub", "txn"
 * @returns {string}
 */
function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Tentukan class warna progress bar berdasarkan persentase dan jenis kategori.
 * @param {number} percentage - 0 sampai 100+
 * @param {boolean} isSavings - True jika kategori tabungan/investasi
 * @returns {string} CSS class: "bg-safe", "bg-caution", atau "bg-over"
 */
function getProgressColor(percentage, isSavings = false) {
  if (isSavings) {
    // Khusus kategori tabungan/investasi: menabung 100% atau lebih adalah hal baik -> tetap hijau aman (bg-safe)
    return 'bg-safe';
  }
  if (percentage <= 60) return 'bg-safe';
  if (percentage <= 90) return 'bg-caution';
  return 'bg-over';
}

/**
 * Hitung persentase.
 * @param {number} spent
 * @param {number} budget
 * @returns {number}
 */
function calcPercentage(spent, budget) {
  if (!budget || budget === 0) return 0;
  return Math.round((spent / budget) * 100);
}

/**
 * Debounce helper untuk input events.
 * @param {Function} fn
 * @param {number} delay - Milliseconds
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
