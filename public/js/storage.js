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
 * 1. Instant boot dari localStorage Hot-Cache (0ms delay!)
 * 2. Background sync kilat via 1 single request /api/sync
 * 3. Setup Supabase Realtime WebSocket
 */
async function initStorage() {
  const month = getCurrentMonth();

  // 1. Instant boot dari Local Hot-Cache jika ada (0ms latency)
  try {
    const cached = localStorage.getItem('budgetku_hot_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.budget && parsed.budget.month === month) {
        _currentBudget = parsed.budget;
      }
      if (Array.isArray(parsed.transactions)) {
        _currentTransactions = parsed.transactions;
      }
      if (Array.isArray(parsed.archives)) {
        _archiveList = parsed.archives;
      }
    }
  } catch (e) {}

  // 2. Setup Supabase Realtime WebSocket Subscriptions
  initSupabaseRealtime();

  // 3. Background sync kilat (non-blocking)
  syncFromSupabase(month);
}

/**
 * Simpan hot-cache ke localStorage (agar instan saat tab dibuka kapan pun)
 */
function persistHotCache() {
  try {
    localStorage.setItem('budgetku_hot_cache', JSON.stringify({
      budget: _currentBudget,
      transactions: _currentTransactions,
      archives: _archiveList,
    }));
  } catch (e) {}
}

/**
 * Setup koneksi Realtime WebSocket Supabase
 */
function initSupabaseRealtime() {
  if (window._supabaseRealtimeActive) return;
  if (!window.supabase) return;

  const urlMeta = document.querySelector('meta[name="supabase-url"]');
  const keyMeta = document.querySelector('meta[name="supabase-key"]');
  const supabaseUrl = urlMeta ? urlMeta.getAttribute('content') : (window.__SUPABASE_CONFIG__ ? window.__SUPABASE_CONFIG__.url : '');
  const supabaseKey = keyMeta ? keyMeta.getAttribute('content') : (window.__SUPABASE_CONFIG__ ? window.__SUPABASE_CONFIG__.key : '');

  if (!supabaseUrl || !supabaseKey) return;

  try {
    _supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

    // Subscribe ke semua perubahan tabel di schema public via WebSocket
    _supabaseClient
      .channel('budgetku-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        async (payload) => {
          console.log('[Supabase Realtime] Perubahan terdeteksi:', payload.table, payload.eventType);
          await syncFromSupabase(getCurrentMonth());
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
 * Sinkronisasi data latar belakang kilat dari Supabase API (1 single request)
 */
async function syncFromSupabase(month) {
  try {
    const res = await fetch(`/api/sync?month=${month}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();

      const prevStr = JSON.stringify({
        budget: _currentBudget,
        transactions: _currentTransactions,
        archives: _archiveList,
      });

      const nextStr = JSON.stringify({
        budget: data.budget || _currentBudget,
        transactions: data.transactions || _currentTransactions,
        archives: data.archives || _archiveList,
      });

      const hasChanged = prevStr !== nextStr;

      if (data.budget) _currentBudget = data.budget;
      if (Array.isArray(data.transactions)) _currentTransactions = data.transactions;
      if (Array.isArray(data.archives)) _archiveList = data.archives;

      persistHotCache();

      // Jika data berbeda dari memori lokal (misal baru pertama kali load), render otomatis
      if (hasChanged) {
        triggerActivePageRender();
      }
    }
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
  persistHotCache();

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
      persistHotCache();
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
async function addCategory(name, budgetAmount, subcategories = [], isSavings = false) {
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
        is_savings: isSavings,
      }),
    });

    if (res.ok) {
      const newCat = await res.json();
      if (!_currentBudget.categories) _currentBudget.categories = [];
      _currentBudget.categories.push(newCat);
      persistHotCache();
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
    if (updates.isSavings !== undefined) cat.isSavings = updates.isSavings;
    if (updates.is_savings !== undefined) {
      cat.is_savings = updates.is_savings;
      cat.isSavings = updates.is_savings;
    }
    persistHotCache();
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
      persistHotCache();
    }
  } catch (err) {
    console.error('Gagal update kategori:', err);
  }
}

/**
 * Realokasi budget antar kategori & sub-kategori (saat overbudget)
 */
async function reallocateCategoryBudget(sourceCatId, targetCatId, amount, sourceSubId = null, targetSubId = null) {
  const sourceCat = _currentBudget.categories.find(c => c.id == sourceCatId);
  const targetCat = _currentBudget.categories.find(c => c.id == targetCatId);

  if (!sourceCat || !targetCat || amount <= 0) return false;

  // 1. Kurangi sumber
  if (sourceSubId && Array.isArray(sourceCat.subcategories)) {
    const sourceSub = sourceCat.subcategories.find(s => s.id == sourceSubId);
    if (sourceSub) {
      sourceSub.budget = Math.max(0, (sourceSub.budget || 0) - amount);
    }
  }
  sourceCat.budget = Math.max(0, (sourceCat.budget || 0) - amount);

  // 2. Tambah target
  if (targetSubId && Array.isArray(targetCat.subcategories)) {
    const targetSub = targetCat.subcategories.find(s => s.id == targetSubId);
    if (targetSub) {
      targetSub.budget = (targetSub.budget || 0) + amount;
    }
  }
  targetCat.budget = (targetCat.budget || 0) + amount;

  // Optimistic memory & local cache update
  persistHotCache();

  try {
    const sourcePayload = { budget: sourceCat.budget };
    if (sourceCat.subcategories) sourcePayload.subcategories = sourceCat.subcategories;

    const targetPayload = { budget: targetCat.budget };
    if (targetCat.subcategories) targetPayload.subcategories = targetCat.subcategories;

    await Promise.all([
      fetch(`/api/categories/${sourceCatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(sourcePayload),
      }),
      fetch(`/api/categories/${targetCatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(targetPayload),
      }),
    ]);
    return true;
  } catch (err) {
    console.error('Gagal realokasi budget:', err);
    return false;
  }
}

function getCategoryRemainingBudget(categoryId) {
  const cat = getCategoryById(categoryId);
  if (!cat) return 0;
  const spentMap = getSpentByCategory();
  const spent = spentMap[categoryId] || 0;
  return (cat.budget || 0) - spent;
}

function getSpentBySubcategory() {
  const transactions = getTransactions();
  const result = {};
  transactions.forEach((txn) => {
    if (txn.type === 'income') return;
    if (txn.subcategoryId) {
      if (!result[txn.subcategoryId]) result[txn.subcategoryId] = 0;
      result[txn.subcategoryId] += txn.amount;
    }
  });
  return result;
}

/**
 * Hapus kategori
 */
async function deleteCategory(categoryId) {
  _currentBudget.categories = _currentBudget.categories.filter(c => c.id != categoryId);
  persistHotCache();

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
  formData.append('type', txn.type || 'expense');
  formData.append('date', txn.date);
  if (txn.categoryId) {
    formData.append('category_id', txn.categoryId);
  }
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
      persistHotCache();
      return newTxn;
    }
  } catch (err) {
    console.error('Gagal simpan transaksi:', err);
  }
  return null;
}

async function updateTransaction(txnId, updates, file = null) {
  const formData = new FormData();
  if (updates.type) formData.append('type', updates.type);
  if (updates.date) formData.append('date', updates.date);
  if (updates.categoryId !== undefined) formData.append('category_id', updates.categoryId || '');
  if (updates.subcategoryId !== undefined) formData.append('subcategory_id', updates.subcategoryId || '');
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
      persistHotCache();
      return updatedTxn;
    }
  } catch (err) {
    console.error('Gagal update transaksi:', err);
  }
}

async function deleteTransaction(txnId) {
  _currentTransactions = _currentTransactions.filter(t => t.id != txnId);
  persistHotCache();

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
    if (txn.type === 'income') return; // Hanya hitung pengeluaran untuk alokasi kategori
    if (txn.categoryId) {
      if (!result[txn.categoryId]) result[txn.categoryId] = 0;
      result[txn.categoryId] += txn.amount;
    }
  });
  return result;
}

function getTotalSpent() {
  const transactions = getTransactions();
  return transactions
    .filter(t => t.type !== 'income')
    .reduce((sum, txn) => sum + txn.amount, 0);
}

function getTotalIncome() {
  const transactions = getTransactions();
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, txn) => sum + txn.amount, 0);
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
