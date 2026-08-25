/* ============================================================
   BudgetKu — Arsip Module (arsip.js)
   Refactored for Supabase Cloud Database Direct Synchronization.
   No localStorage reads for budget or archive data.
   ============================================================ */

let archiveChartInstance = null;
let currentArchiveEntry = null;

/**
 * Inisialisasi Halaman Arsip secara Asynchronous dari Supabase
 */
async function initArsip() {
  const pageLoader = document.getElementById('page-loader');
  const mainContent = document.getElementById('main-content');

  // 1. Tampilkan page-loader dan sembunyikan main-content di awal
  if (pageLoader) pageLoader.classList.remove('d-none');
  if (mainContent) mainContent.classList.add('d-none');

  try {
    const btnClose = document.getElementById('btn-close-detail');
    if (btnClose) btnClose.addEventListener('click', closeDetail);

    const btnExport = document.getElementById('btn-export-csv');
    if (btnExport) btnExport.addEventListener('click', handleExportCSV);

    await loadAndRenderArchives();
  } catch (err) {
    console.error('[Arsip] Error saat inisialisasi arsip:', err);
  } finally {
    // 2. Akhir inisialisasi: Sembunyikan page-loader dan tampilkan main-content
    if (pageLoader) pageLoader.classList.add('d-none');
    if (mainContent) mainContent.classList.remove('d-none');
  }
}

window.initArsip = initArsip;

/**
 * Fetch data riwayat arsip dari tabel budgets (di mana month != currentMonth)
 */
async function loadAndRenderArchives() {
  const container = document.getElementById('archive-cards-container');
  const emptyState = document.getElementById('archive-empty-state');

  try {
    const supabase = typeof window.getSupabaseClient === 'function' 
      ? window.getSupabaseClient() 
      : window.supabaseClient;

    const user = typeof window.getActiveSupabaseUser === 'function' 
      ? await window.getActiveSupabaseUser() 
      : null;

    const currentMonth = typeof window.getCurrentMonth === 'function' 
      ? window.getCurrentMonth() 
      : (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'));

    let archives = [];

    // 1. Sync data dari backend/Supabase untuk relasi transaksi & kategori
    if (typeof window.syncFromSupabase === 'function') {
      await window.syncFromSupabase(currentMonth);
    }

    // 2. Query SELECT ke tabel budgets di mana month != currentMonth
    if (supabase && user && user.id) {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .neq('month', currentMonth)
        .order('month', { ascending: false });

      if (!error && Array.isArray(data)) {
        const syncedArchives = typeof window.getArchive === 'function' ? window.getArchive() : [];
        
        if (syncedArchives.length > 0) {
          archives = syncedArchives;
        } else {
          // Format data dari Supabase jika getArchive kosong
          archives = data.map(b => ({
            id: String(b.id),
            month: b.month,
            totalBudget: Number(b.total_budget) || 0,
            totalSpent: 0,
            totalIncome: 0,
            categories: [],
            transactions: []
          }));
        }
      } else {
        archives = typeof window.getArchive === 'function' ? window.getArchive() : [];
      }
    } else {
      archives = typeof window.getArchive === 'function' ? window.getArchive() : [];
    }

    renderArchiveCards(archives);
  } catch (err) {
    console.error('[Arsip] Gagal memuat data arsip dari Supabase:', err);
    renderArchiveCards([]);
  }
}

/**
 * Render kartu-kartu arsip bulanan
 */
function renderArchiveCards(archivesList = null) {
  const archives = archivesList !== null ? archivesList : (typeof window.getArchive === 'function' ? window.getArchive() : []);
  const container = document.getElementById('archive-cards-container');
  const emptyState = document.getElementById('archive-empty-state');
  
  if (!container) return;
  container.innerHTML = '';
  
  if (!archives || archives.length === 0) {
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }
  
  if (emptyState) emptyState.classList.add('d-none');
  
  // Sort newest first based on month string 'YYYY-MM'
  archives.sort((a, b) => b.month.localeCompare(a.month));
  
  archives.forEach((archive) => {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-lg-3';
    
    const isHemat = (archive.totalSpent || 0) <= (archive.totalBudget || 0);
    const badgeClass = isHemat ? 'badge-hemat text-success' : 'badge-over text-danger';
    const badgeText = isHemat ? 'Hemat' : 'Overbudget';
    const badgeIcon = isHemat ? 'bi-check-circle' : 'bi-exclamation-triangle';
    
    col.innerHTML = `
      <div class="card card-budgetku archive-card h-100 shadow-sm border" style="cursor: pointer;" data-month="${archive.month}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title fw-bold text-dark">${window.formatMonth ? window.formatMonth(archive.month) : archive.month}</h5>
          <div class="mt-2 mb-2">
            <small class="text-muted d-block">Anggaran:</small>
            <span class="fw-semibold text-dark font-monospace">${window.formatRupiah ? window.formatRupiah(archive.totalBudget) : 'Rp ' + archive.totalBudget}</span>
          </div>
          <div class="mb-3">
            <small class="text-muted d-block">Pengeluaran:</small>
            <span class="fw-semibold text-dark font-monospace">${window.formatRupiah ? window.formatRupiah(archive.totalSpent) : 'Rp ' + archive.totalSpent}</span>
          </div>
          <div class="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
            <span class="${badgeClass} small fw-bold"><i class="bi ${badgeIcon}"></i> ${badgeText}</span>
            <span class="text-primary small fw-semibold">Lihat Detail <i class="bi bi-chevron-right"></i></span>
          </div>
        </div>
      </div>
    `;
    
    col.querySelector('.archive-card').addEventListener('click', function() {
      document.querySelectorAll('.archive-card').forEach(c => c.classList.remove('active', 'border-primary'));
      this.classList.add('active', 'border-primary');
      showArchiveDetail(archive);
    });
    
    container.appendChild(col);
  });
}

function showArchiveDetail(archive) {
  currentArchiveEntry = archive;
  const detailSection = document.getElementById('archive-detail-section');
  if (!detailSection) return;
  detailSection.classList.remove('d-none');
  
  const monthTitleEl = document.getElementById('detail-month-title');
  if (monthTitleEl) {
    monthTitleEl.textContent = `Detail: ${window.formatMonth ? window.formatMonth(archive.month) : archive.month}`;
  }
  
  const totalBudget = archive.totalBudget || 0;
  const totalSpent = archive.totalSpent || 0;

  // Summary Cards
  const totalBudgetEl = document.getElementById('detail-total-budget');
  if (totalBudgetEl) totalBudgetEl.textContent = window.formatRupiah ? window.formatRupiah(totalBudget) : 'Rp ' + totalBudget;
  
  const totalSpentEl = document.getElementById('detail-total-spent');
  if (totalSpentEl) totalSpentEl.textContent = window.formatRupiah ? window.formatRupiah(totalSpent) : 'Rp ' + totalSpent;
  
  const remaining = totalBudget - totalSpent;
  const remainingCard = document.getElementById('detail-remaining-card');
  const remainingEl = document.getElementById('detail-total-remaining');
  
  if (remainingEl) {
    if (remaining < 0) {
      if (remainingCard) {
        remainingCard.classList.add('overbudget');
        remainingCard.classList.remove('bg-light');
      }
      remainingEl.textContent = '- ' + (window.formatRupiah ? window.formatRupiah(Math.abs(remaining)) : 'Rp ' + Math.abs(remaining));
    } else {
      if (remainingCard) {
        remainingCard.classList.remove('overbudget');
      }
      remainingEl.textContent = window.formatRupiah ? window.formatRupiah(remaining) : 'Rp ' + remaining;
    }
  }
  
  renderChart(archive);
  renderProgressBars(archive);
  renderTransactionsTable(archive);
  
  detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeDetail() {
  const detailSection = document.getElementById('archive-detail-section');
  if (detailSection) detailSection.classList.add('d-none');
  document.querySelectorAll('.archive-card').forEach(c => c.classList.remove('active', 'border-primary'));
  currentArchiveEntry = null;
}

function renderChart(archive) {
  const chartCanvas = document.getElementById('archive-budget-chart');
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');
  
  if (archiveChartInstance) {
    archiveChartInstance.destroy();
  }
  
  const labels = [];
  const data = [];
  const backgroundColor = [
    '#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', 
    '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'
  ];
  
  const categories = archive.categories || [];
  categories.forEach(cat => {
    if (cat.budget > 0) {
      labels.push(cat.name);
      data.push(cat.budget);
    }
  });
  
  if (labels.length === 0) {
    labels.push('Belum ada anggaran');
    data.push(1);
    backgroundColor[0] = '#e9ecef';
  }
  
  archiveChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColor.slice(0, data.length),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            boxWidth: 8
          }
        }
      },
      cutout: '70%'
    }
  });
}

function renderProgressBars(archive) {
  const container = document.getElementById('archive-category-progress-container');
  if (!container) return;
  container.innerHTML = '';
  
  const categories = archive.categories || [];
  const spentByCategory = {};
  categories.forEach(c => spentByCategory[c.id] = 0);
  
  if (archive.transactions) {
    archive.transactions.forEach(t => {
      if (t.type === 'income' || t.type === 'reallocation' || t.type === 'transfer') return;
      if (spentByCategory[t.categoryId] !== undefined) {
        spentByCategory[t.categoryId] += t.amount;
      }
    });
  }
  
  if (categories.length === 0) {
    container.innerHTML = '<p class="text-muted small">Tidak ada kategori anggaran.</p>';
    return;
  }
  
  categories.forEach(cat => {
    const spent = spentByCategory[cat.id] || 0;
    const budget = cat.budget || 0;
    const percentage = typeof window.calcPercentage === 'function' ? window.calcPercentage(spent, budget) : (budget > 0 ? Math.round((spent / budget) * 100) : 0);
    const colorClass = typeof window.getProgressColor === 'function' ? window.getProgressColor(percentage, !!(cat.isSavings || cat.is_savings)) : 'bg-primary';
    
    const div = document.createElement('div');
    div.className = 'category-progress mb-3';
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-end mb-1">
        <span class="fw-medium small">${cat.name} ${cat.isSavings || cat.is_savings ? '<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill small ms-1"><i class="bi bi-piggy-bank"></i></span>' : ''}</span>
        <span class="small text-muted">${window.formatRupiahShort ? window.formatRupiahShort(spent) : window.formatRupiah(spent)} / ${window.formatRupiahShort ? window.formatRupiahShort(budget) : window.formatRupiah(budget)}</span>
      </div>
      <div class="progress progress-budgetku" style="height: 8px;">
        <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${Math.min(percentage, 100)}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderTransactionsTable(archive) {
  const tbody = document.getElementById('archive-transactions-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (!archive.transactions || archive.transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Tidak ada transaksi pada bulan ini.</td></tr>`;
    return;
  }
  
  const sortedTxns = [...archive.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const categories = archive.categories || [];
  
  sortedTxns.forEach(txn => {
    const isIncome = txn.type === 'income';
    const isReallocation = txn.type === 'reallocation';
    const isTransfer = txn.type === 'transfer';
    let catHtml = '';
    let amountHtml = '';

    if (isIncome) {
      catHtml = `<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle"><i class="bi bi-arrow-down-left me-1"></i>Pemasukan</span>`;
      amountHtml = `<span class="text-success fw-bold font-monospace">+${window.formatRupiah(txn.amount)}</span>`;
    } else if (isReallocation) {
      catHtml = `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle"><i class="bi bi-arrow-left-right me-1"></i>Realokasi</span>`;
      amountHtml = `<span class="text-secondary fw-semibold font-monospace">↔ ${window.formatRupiah(txn.amount)}</span>`;
    } else if (isTransfer) {
      catHtml = `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle"><i class="bi bi-arrow-left-right me-1"></i>Mutasi</span>`;
      amountHtml = `<span class="text-secondary fw-semibold font-monospace">↔ ${window.formatRupiah(txn.amount)}</span>`;
    } else {
      let catName = 'Uncategorized';
      let subCatName = '';
      
      const cat = categories.find(c => c.id == txn.categoryId);
      if (cat) {
        catName = cat.name;
        if (txn.subcategoryId && cat.subcategories) {
          const sub = cat.subcategories.find(s => s.id == txn.subcategoryId);
          if (sub) {
            subCatName = ` <span class="text-muted small">› ${sub.name}</span>`;
          }
        }
      }
      catHtml = `<div>${catName}${subCatName}</div>`;
      amountHtml = `<span class="fw-medium font-monospace text-dark">-${window.formatRupiah(txn.amount)}</span>`;
    }
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="fw-medium text-nowrap">${window.formatDateShort ? window.formatDateShort(txn.date) : txn.date}</div>
      </td>
      <td>
        ${catHtml}
      </td>
      <td>
        <div>${txn.description || '-'}</div>
        ${txn.hasReceipt ? '<span class="badge bg-light text-secondary border mt-1"><i class="bi bi-receipt"></i> Ada struk</span>' : ''}
      </td>
      <td class="text-end">
        ${amountHtml}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleExportCSV() {
  if (!currentArchiveEntry) return;
  
  try {
    const csvContent = window.exportArchiveToCSV ? window.exportArchiveToCSV(currentArchiveEntry) : '';
    const monthName = (window.formatMonth ? window.formatMonth(currentArchiveEntry.month) : currentArchiveEntry.month).replace(' ', '-');
    const filename = 'BudgetKu_' + monthName + '.csv';
    if (window.downloadCSV) {
      window.downloadCSV(csvContent, filename);
    }
  } catch (e) {
    console.error('Failed to export CSV:', e);
    alert('Gagal mengekspor CSV.');
  }
}
