/* ============================================================
   BudgetKu — High-Performance Realtime Data Layer
   
   - Instant Server-Hydrated Boot (0ms initial latency)
   - Supabase Realtime WebSocket Subscriptions (Live sync across tabs & devices)
   - Optimistic UI Updates
   ============================================================ */

// In-memory data store
let _currentBudget = {
  month: getCurrentMonth(),
  totalBudget: 0,
  categories: [],
};
let _currentTransactions = [];
let _archiveList = [];
let _supabaseClient = null;

/**
 * Inisialisasi Storage:
 * 1. Boot langsung dari window.__INITIAL_DATA__ (0ms delay)
 * 2. Setup Supabase Realtime WebSocket
 */
async function initStorage() {
  const month = getCurrentMonth();

  // 1. Instant boot dari server-hydrated data jika tersedia
  if (window.__INITIAL_DATA__) {
    if (window.__INITIAL_DATA__.budget) {
      _currentBudget = window.__INITIAL_DATA__.budget;
    }
    if (window.__INITIAL_DATA__.transactions) {
      _currentTransactions = window.__INITIAL_DATA__.transactions;
    }
    if (window.__INITIAL_DATA__.archives) {
      _archiveList = window.__INITIAL_DATA__.archives;
    }
  } else {
    // Fallback fetching jika dibuka secara direct API
    await syncFromSupabase(month);
  }

  // 2. Setup Supabase Realtime WebSocket Subscriptions
  initSupabaseRealtime();
}

/**
 * Setup koneksi Realtime WebSocket Supabase
 */
function initSupabaseRealtime() {
  if (window._supabaseRealtimeActive) return;
  if (!window.supabase || !window.__SUPABASE_CONFIG__ || !window.__SUPABASE_CONFIG__.url || !window.__SUPABASE_CONFIG__.key) {
    return;
  }

  try {
    _supabaseClient = window.supabase.createClient(
      window.__SUPABASE_CONFIG__.url,
      window.__SUPABASE_CONFIG__.key
    );

    // Subscribe ke semua perubahan tabel di schema public
    _supabaseClient
      .channel('budgetku-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        async (payload) => {
          console.log('[Supabase Realtime] Perubahan terdeteksi:', payload.table, payload.eventType);
          await syncFromSupabase(getCurrentMonth());
          triggerActivePageRender();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Terhubung & Aktif via WebSocket!');
        }
      });

    window._supabaseRealtimeActive = true;
  } catch (err) {
    console.warn('[Supabase Realtime] Inisialisasi realtime gagal:', err);
  }
}

/**
 * Sinkronisasi data latar belakang dari Supabase API
 */
async function syncFromSupabase(month) {
  try {
    const [budgetRes, txnRes, archiveRes] = await Promise.all([
      fetch(`/api/budget?month=${month}`),
      fetch(`/api/transactions?month=${month}`),
      fetch('/api/archive'),
    ]);

    if (budgetRes.ok) _currentBudget = await budgetRes.json();
    if (txnRes.ok) _currentTransactions = await txnRes.json();
    if (archiveRes.ok) _archiveList = await archiveRes.json();
  } catch (err) {
    console.error('Sinkronisasi Supabase gagal:', err);
  }
}

/**
 * Trigger re-render halaman aktif saat ada update realtime
 */
function triggerActivePageRender() {
  const path = window.location.pathname.toLowerCase();
  
  if (path.includes('budget')) {
    if (typeof renderTotalBudget === 'function') renderTotalBudget();
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof updateAllocationSummary === 'function') updateAllocationSummary();
  } else if (path.includes('tracker')) {
    if (typeof populateCategorySelects === 'function') populateCategorySelects();
    if (typeof loadTransactions === 'function') loadTransactions();
  } else if (path.includes('arsip')) {
    if (typeof renderArchiveCards === 'function') renderArchiveCards();
  } else {
    // Dashboard
    if (typeof initDashboard === 'function') initDashboard();
  }
}

/* ---------- Budget (Supabase Database) ---------- */

function getBudget() {
  return _currentBudget;
}

function saveBudget(budget) {
  _currentBudget = budget;
}

/**
 * Update total budget (Optimistic + Background Async Sync)
 */
async function updateTotalBudget(amount) {
  _currentBudget.totalBudget = amount;

  try {
    const res = await fetch('/api/budget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        month: _currentBudget.month || getCurrentMonth(),
        amount: amount,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      _currentBudget.totalBudget = data.totalBudget;
      return true;
    }
  } catch (err) {
    console.error('Gagal update budget:', err);
  }
  return false;
}

/**
 * Tambah kategori baru
 */
async function addCategory(name, budgetAmount, subcategories = []) {
  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        month: _currentBudget.month || getCurrentMonth(),
        name: name,
        budget: budgetAmount,
        subcategories: subcategories,
      }),
    });

    if (res.ok) {
      const newCat = await res.json();
      if (!_currentBudget.categories) _currentBudget.categories = [];
      _currentBudget.categories.push(newCat);
      return newCat;
    }
  } catch (err) {
    console.error('Gagal menambah kategori:', err);
  }
  return null;
}

/**
 * Update kategori
 */
async function updateCategory(categoryId, updates) {
  const cat = _currentBudget.categories.find(c => c.id == categoryId);
  if (cat) {
    if (updates.name !== undefined) cat.name = updates.name;
    if (updates.budget !== undefined) cat.budget = updates.budget;
    if (updates.subcategories !== undefined) cat.subcategories = updates.subcategories;
  }

  try {
    const res = await fetch(`/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const updatedCat = await res.json();
      const idx = _currentBudget.categories.findIndex(c => c.id == categoryId);
      if (idx !== -1) {
        _currentBudget.categories[idx] = updatedCat;
      }
    }
  } catch (err) {
    console.error('Gagal update kategori:', err);
  }
}

/**
 * Hapus kategori
 */
async function deleteCategory(categoryId) {
  _currentBudget.categories = _currentBudget.categories.filter(c => c.id != categoryId);

  try {
    await fetch(`/api/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
  } catch (err) {
    console.error('Gagal hapus kategori:', err);
  }
}

function getCategories() {
  return _currentBudget && _currentBudget.categories ? _currentBudget.categories : [];
}

function getCategoryById(categoryId) {
  const categories = getCategories();
  return categories.find(c => c.id == categoryId) || null;
}

/* ---------- Transactions & Receipts ---------- */

function getTransactions() {
  return _currentTransactions || [];
}

async function addTransaction(txn, file = null) {
  const formData = new FormData();
  formData.append('date', txn.date);
  formData.append('category_id', txn.categoryId);
  if (txn.subcategoryId) {
    formData.append('subcategory_id', txn.subcategoryId);
  }
  formData.append('description', txn.description);
  formData.append('amount', txn.amount);
  formData.append('month', _currentBudget.month || getCurrentMonth());

  if (file) {
    formData.append('receipt', file);
  }

  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (res.ok) {
      const newTxn = await res.json();
      _currentTransactions.unshift(newTxn);
      return newTxn;
    }
  } catch (err) {
    console.error('Gagal simpan transaksi:', err);
  }
  return null;
}

async function updateTransaction(txnId, updates, file = null) {
  const formData = new FormData();
  if (updates.date) formData.append('date', updates.date);
  if (updates.categoryId) formData.append('category_id', updates.categoryId);
  if (updates.subcategoryId) formData.append('subcategory_id', updates.subcategoryId);
  if (updates.description) formData.append('description', updates.description);
  if (updates.amount) formData.append('amount', updates.amount);

  if (file) {
    formData.append('receipt', file);
  }

  try {
    const res = await fetch(`/api/transactions/${txnId}`, {
      method: 'POST',
      headers: {
        'X-HTTP-Method-Override': 'PUT',
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (res.ok) {
      const updatedTxn = await res.json();
      const idx = _currentTransactions.findIndex(t => t.id == txnId);
      if (idx !== -1) {
        _currentTransactions[idx] = updatedTxn;
      }
      return updatedTxn;
    }
  } catch (err) {
    console.error('Gagal update transaksi:', err);
  }
}

async function deleteTransaction(txnId) {
  _currentTransactions = _currentTransactions.filter(t => t.id != txnId);

  try {
    await fetch(`/api/transactions/${txnId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
  } catch (err) {
    console.error('Gagal hapus transaksi:', err);
  }
}

async function saveReceipt(id, file, filename) {
  const formData = new FormData();
  formData.append('receipt', file, filename);

  try {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'POST',
      headers: {
        'X-HTTP-Method-Override': 'PUT',
      },
      body: formData,
    });

    if (res.ok) {
      const updatedTxn = await res.json();
      const idx = _currentTransactions.findIndex(t => t.id == id);
      if (idx !== -1) {
        _currentTransactions[idx] = updatedTxn;
      }
    }
  } catch (err) {
    console.error('Gagal upload struk:', err);
  }
}

async function getReceiptURL(id) {
  const txn = _currentTransactions.find(t => t.id == id);
  return txn && txn.receiptUrl ? txn.receiptUrl : null;
}

async function deleteReceipt(id) {}

function getSpentByCategory() {
  const transactions = getTransactions();
  const result = {};
  transactions.forEach((txn) => {
    if (!result[txn.categoryId]) result[txn.categoryId] = 0;
    result[txn.categoryId] += txn.amount;
  });
  return result;
}

function getTotalSpent() {
  const transactions = getTransactions();
  return transactions.reduce((sum, txn) => sum + txn.amount, 0);
}

/* ---------- Archive ---------- */

function getArchive() {
  return _archiveList || [];
}

async function checkMonthTransition() {}

function exportArchiveToCSV(archiveEntry) {
  const categories = archiveEntry.categories || [];
  const transactions = archiveEntry.transactions || [];

  const lines = [];
  lines.push('Tanggal,Kategori,Sub-Kategori,Keterangan,Nominal');

  transactions.forEach((txn) => {
    const cat = categories.find((c) => c.id == txn.categoryId);
    const catName = cat ? cat.name : '-';
    let subName = '-';
    if (cat && txn.subcategoryId) {
      const sub = cat.subcategories.find((s) => s.id == txn.subcategoryId);
      subName = sub ? sub.name : '-';
    }
    const desc = (txn.description || '').replace(/"/g, '""');
    lines.push(
      `${txn.date},"${catName}","${subName}","${desc}",${txn.amount}`
    );
  });

  lines.push('');
  lines.push('--- Ringkasan Budget ---');
  lines.push(`Total Budget,${archiveEntry.totalBudget}`);
  lines.push(`Total Pengeluaran,${archiveEntry.totalSpent}`);
  lines.push(
    `Sisa,${archiveEntry.totalBudget - archiveEntry.totalSpent}`
  );
  lines.push('');
  lines.push('Kategori,Budget,Terpakai');
  categories.forEach((cat) => {
    const spent = transactions
      .filter((t) => t.categoryId == cat.id)
      .reduce((s, t) => s + t.amount, 0);
    lines.push(`"${cat.name}",${cat.budget},${spent}`);
  });

  return lines.join('\n');
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
