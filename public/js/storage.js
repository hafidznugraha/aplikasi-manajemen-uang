/* ============================================================
   BudgetKu — High-Performance Realtime Data Layer
   
   - Multi-User Isolated Storage Architecture
   - Instant Server-Hydrated Boot (0ms initial latency)
   - Supabase Realtime WebSocket Subscriptions (Live sync across tabs & devices)
   - Optimistic UI Updates
   ============================================================ */

/**
 * Dapatkan data pengguna yang sedang login dari localStorage
 * @returns {object|null}
 */
function getActiveUser() {
  try {
    const userStr = localStorage.getItem('budgetku_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Dapatkan ID pengguna yang sedang login
 * @returns {string}
 */
function getActiveUserId() {
  const user = getActiveUser();
  return user && user.id ? user.id : 'usr-default';
}

// Expose fungsi identifikasi user ke window global
window.getActiveUser = getActiveUser;
window.getActiveUserId = getActiveUserId;

function getCacheKey() {
  return 'budgetku_hot_cache_' + getActiveUserId();
}

// In-memory data store
let _currentBudget = {
  month: getCurrentMonth(),
  totalBudget: 0,
  total_budget: 0,
  totalCash: 0,
  total_cash: 0,
  categories: [],
  user_id: getActiveUserId(),
  userId: getActiveUserId(),
};
let _currentTransactions = [];
let _archiveList = [];
let _supabaseClient = null;

/**
 * Inisialisasi Storage:
 * 1. Setup Supabase Realtime WebSocket
 * 2. Background sync kilat langsung dari database Supabase
 */
async function initStorage() {
  const month = getCurrentMonth();
  const userId = getActiveUserId();

  // Reset in-memory state agar bersih untuk user saat ini
  _currentBudget = {
    month: month,
    totalBudget: 0,
    total_budget: 0,
    totalCash: 0,
    total_cash: 0,
    categories: [],
    user_id: userId,
    userId: userId,
  };
  _currentTransactions = [];
  _archiveList = [];

  // 1. Setup Supabase Realtime WebSocket Subscriptions
  initSupabaseRealtime();

  // 2. Background sync kilat langsung dari database Supabase (non-blocking)
  await syncFromSupabase(month);
}

/**
 * Persistensi data kini ditangani secara langsung oleh Supabase Cloud Database
 */
function persistHotCache() {
  // LocalStorage untuk budget dan kategori dinonaktifkan agar tersinkronisasi murni via Supabase
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
    const userId = getActiveUserId();
    const res = await fetch(`/api/sync?month=${month}&user_id=${encodeURIComponent(userId)}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();

      const prevStr = JSON.stringify({
        budget: _currentBudget,
        transactions: _currentTransactions,
        archives: _archiveList,
      });

      if (data.budget) {
        const b = data.budget;
        b.user_id = b.user_id || userId;
        b.userId = b.userId || userId;
        if (Array.isArray(b.categories)) {
          b.categories = b.categories.map(c => ({
            ...c,
            user_id: c.user_id || userId,
            userId: c.userId || userId,
          }));
        }
        _currentBudget = b;
      }

      if (Array.isArray(data.transactions)) {
        _currentTransactions = data.transactions
          .filter(t => !t.user_id || t.user_id === userId)
          .map(t => ({
            ...t,
            user_id: t.user_id || userId,
            userId: t.userId || userId,
          }));
      }

      if (Array.isArray(data.archives)) {
        _archiveList = data.archives
          .filter(a => !a.user_id || a.user_id === userId)
          .map(a => ({
            ...a,
            user_id: a.user_id || userId,
            userId: a.userId || userId,
          }));
      }

      persistHotCache();

      const nextStr = JSON.stringify({
        budget: _currentBudget,
        transactions: _currentTransactions,
        archives: _archiveList,
      });

      const hasChanged = prevStr !== nextStr;
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
  const userId = getActiveUserId();
  if (!_currentBudget) {
    _currentBudget = {
      month: getCurrentMonth(),
      totalBudget: 0,
      categories: [],
      user_id: userId,
      userId: userId,
    };
  }
  return _currentBudget;
}

function saveBudget(budget) {
  const userId = getActiveUserId();
  budget.user_id = userId;
  budget.userId = userId;
  _currentBudget = budget;
  persistHotCache();
}

/**
 * Update total budget (Bank & Tunai) (Optimistic + Background Async Sync)
 */
async function updateTotalBudget(amount, cashAmount = 0) {
  const userId = getActiveUserId();
  _currentBudget.totalBudget = amount;
  _currentBudget.total_budget = amount;
  _currentBudget.totalCash = cashAmount;
  _currentBudget.total_cash = cashAmount;
  _currentBudget.user_id = userId;
  _currentBudget.userId = userId;
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
        total_budget: amount,
        total_cash: cashAmount,
        user_id: userId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.totalBudget != null) _currentBudget.totalBudget = data.totalBudget;
      if (data.totalCash != null) _currentBudget.totalCash = data.totalCash;
      _currentBudget.user_id = userId;
      _currentBudget.userId = userId;
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
  const userId = getActiveUserId();
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
        user_id: userId,
      }),
    });

    if (res.ok) {
      const newCat = await res.json();
      newCat.user_id = userId;
      newCat.userId = userId;
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
    if (txn.type === 'income' || txn.type === 'reallocation') return;
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
  const userId = getActiveUserId();
  const allCats = _currentBudget && _currentBudget.categories ? _currentBudget.categories : [];
  return allCats.filter(c => !c.user_id || c.user_id === userId);
}

function getCategoryById(categoryId) {
  const categories = getCategories();
  return categories.find(c => c.id == categoryId) || null;
}

/* ---------- Transactions & Receipts ---------- */

function getTransactions() {
  const userId = getActiveUserId();
  return (_currentTransactions || []).filter(t => !t.user_id || t.user_id === userId);
}

async function addTransaction(txn, file = null) {
  const userId = getActiveUserId();
  txn.user_id = userId;
  txn.userId = userId;

  const fundSource = txn.fund_source || txn.fundSource || 'bank';

  const formData = new FormData();
  formData.append('type', txn.type || 'expense');
  formData.append('fund_source', fundSource);
  formData.append('user_id', userId);
  if (txn.is_system !== undefined) {
    formData.append('is_system', txn.is_system ? '1' : '0');
  }
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
      newTxn.user_id = userId;
      newTxn.userId = userId;
      newTxn.fund_source = newTxn.fund_source || fundSource;
      newTxn.fundSource = newTxn.fundSource || fundSource;
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
  const userId = getActiveUserId();
  updates.user_id = userId;
  updates.userId = userId;

  const formData = new FormData();
  formData.append('user_id', userId);
  if (updates.type) formData.append('type', updates.type);
  if (updates.fund_source || updates.fundSource) {
    formData.append('fund_source', updates.fund_source || updates.fundSource);
  }
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
      updatedTxn.user_id = userId;
      updatedTxn.userId = userId;
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
      const userId = getActiveUserId();
      updatedTxn.user_id = userId;
      updatedTxn.userId = userId;
      const idx = _currentTransactions.findIndex(t => t.id == id);
      if (idx !== -1) {
        _currentTransactions[idx] = updatedTxn;
      }
      persistHotCache();
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
    if (txn.type === 'income' || txn.type === 'reallocation') return; // Hanya hitung pengeluaran riil untuk alokasi kategori
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
    .filter(t => t.type !== 'income' && t.type !== 'reallocation')
    .reduce((sum, txn) => sum + txn.amount, 0);
}

function getTotalIncome() {
  const transactions = getTransactions();
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, txn) => sum + txn.amount, 0);
}

function getSpentByFundSource() {
  const transactions = getTransactions();
  const result = { bank: 0, cash: 0 };
  transactions.forEach((txn) => {
    if (txn.type === 'income' || txn.type === 'reallocation') return;
    const source = (txn.fund_source || txn.fundSource || 'bank').toLowerCase();
    if (source === 'cash') {
      result.cash += txn.amount;
    } else {
      result.bank += txn.amount;
    }
  });
  return result;
}

function getIncomeByFundSource() {
  const transactions = getTransactions();
  const result = { bank: 0, cash: 0 };
  transactions.forEach((txn) => {
    if (txn.type !== 'income') return;
    const source = (txn.fund_source || txn.fundSource || 'bank').toLowerCase();
    if (source === 'cash') {
      result.cash += txn.amount;
    } else {
      result.bank += txn.amount;
    }
  });
  return result;
}

function getFundSourceBalances() {
  const budget = getBudget();
  const initialBank = budget.total_budget != null ? budget.total_budget : (budget.totalBudget || 0);
  const initialCash = budget.total_cash != null ? budget.total_cash : (budget.totalCash || 0);

  const spent = getSpentByFundSource();
  const income = getIncomeByFundSource();

  return {
    bank: {
      initial: initialBank,
      spent: spent.bank,
      income: income.bank,
      remaining: (initialBank + income.bank) - spent.bank,
    },
    cash: {
      initial: initialCash,
      spent: spent.cash,
      income: income.cash,
      remaining: (initialCash + income.cash) - spent.cash,
    }
  };
}

window.getSpentByFundSource = getSpentByFundSource;
window.getIncomeByFundSource = getIncomeByFundSource;
window.getFundSourceBalances = getFundSourceBalances;

/* ---------- Archive ---------- */

function getArchive() {
  const userId = getActiveUserId();
  return (_archiveList || []).filter(a => !a.user_id || a.user_id === userId);
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
