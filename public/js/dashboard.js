/* ============================================================
   BudgetKu — Dashboard Module (dashboard.js)
   Refactored for Direct Supabase Database Synchronization.
   No localStorage reads for budget, categories, or transactions.
   ============================================================ */

let budgetChartInstance = null;
let dailyChartInstance = null;
let recentCurrentPage = 1;
const recentItemsPerPage = 5;

/**
 * Inisialisasi Dashboard secara Asynchronous langsung dari Supabase
 */
async function initDashboard() {
  const setupAlert = document.getElementById('setup-alert');
  const emptyState = document.getElementById('empty-state');
  const dashboardContent = document.getElementById('dashboard-content');

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

    let totalBudget = 0;
    let budgetData = null;

    // 2. Query SELECT ke tabel 'budgets' berdasarkan user_id dan month saat ini
    if (supabase && user && user.id) {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      if (!error && data) {
        budgetData = data;
        const bankBudget = Number(data.total_budget) || 0;
        const cashBudget = Number(data.total_cash) || 0;
        totalBudget = bankBudget + cashBudget;
        
        // Update in-memory state
        if (typeof window.getBudget === 'function') {
          const inMem = window.getBudget();
          inMem.totalBudget = totalBudget;
          inMem.total_budget = bankBudget;
          inMem.totalCash = cashBudget;
          inMem.total_cash = cashBudget;
          inMem.month = currentMonth;
          inMem.user_id = user.id;
        }
      }
    }

    // Fallback ke in-memory jika direct query tidak mengembalikan data
    if (!budgetData && typeof window.getBudget === 'function') {
      const inMem = window.getBudget();
      const inMemBank = inMem.total_budget != null ? inMem.total_budget : inMem.totalBudget;
      const inMemCash = inMem.total_cash != null ? inMem.total_cash : (inMem.totalCash || 0);
      const combined = (inMemBank || 0) + (inMemCash || 0);
      if (combined > 0) {
        totalBudget = combined;
        budgetData = inMem;
      }
    }

    // Evaluasi apakah budget sudah diatur
    if (!budgetData || totalBudget === 0) {
      if (setupAlert) setupAlert.classList.remove('d-none');
      if (emptyState) emptyState.classList.remove('d-none');
      if (dashboardContent) dashboardContent.classList.add('d-none');
      return;
    }

    // Jika data budget ditemukan: Sembunyikan alert & empty state, tampilkan dashboard
    if (setupAlert) setupAlert.classList.add('d-none');
    if (emptyState) emptyState.classList.add('d-none');
    if (dashboardContent) dashboardContent.classList.remove('d-none');

    const activeBudget = typeof window.getBudget === 'function' ? window.getBudget() : { totalBudget: totalBudget, categories: [] };
    activeBudget.totalBudget = totalBudget;

    renderSummaryCards(activeBudget);
    renderChart(activeBudget);
    renderCategoryProgress(activeBudget);
    renderDailyExpenseChart(activeBudget);
    renderRecentTransactions(activeBudget);
  } catch (err) {
    console.error('[Dashboard] Error saat memuat data dari Supabase:', err);
    if (setupAlert) setupAlert.classList.remove('d-none');
  }
}

window.initDashboard = initDashboard;

function renderSummaryCards(budget) {
  const baselineBudget = budget.totalBudget || 0;
  const totalIncome = typeof window.getTotalIncome === 'function' ? window.getTotalIncome() : 0;
  const totalSpent = typeof window.getTotalSpent === 'function' ? window.getTotalSpent() : 0;
  const effectiveBudget = baselineBudget + totalIncome;
  const remaining = effectiveBudget - totalSpent;

  const totalBudgetEl = document.getElementById('total-budget');
  if (totalBudgetEl) totalBudgetEl.textContent = window.formatRupiah(baselineBudget);
  
  const incomeNoteEl = document.getElementById('total-budget-income-note');
  if (incomeNoteEl) {
    if (totalIncome > 0) {
      incomeNoteEl.textContent = `+ ${window.formatRupiah(totalIncome)} dari pemasukan`;
      incomeNoteEl.classList.remove('d-none');
    } else {
      incomeNoteEl.classList.add('d-none');
    }
  }

  const totalSpentEl = document.getElementById('total-spent');
  if (totalSpentEl) totalSpentEl.textContent = window.formatRupiah(totalSpent);
  
  const remainingEl = document.getElementById('total-remaining');
  if (remainingEl) remainingEl.textContent = window.formatRupiah(remaining);
  
  const remainingCard = document.getElementById('remaining-card');
  if (remainingCard) {
    if (remaining < 0) {
      remainingCard.classList.add('overbudget');
    } else {
      remainingCard.classList.remove('overbudget');
    }
  }
}

function renderChart(budget) {
  const ctx = document.getElementById('budgetChart');
  if (!ctx) return;

  const categories = typeof window.getCategories === 'function' ? window.getCategories() : [];
  if (categories.length === 0) return;

  const labels = categories.map(c => c.name);
  const data = categories.map(c => c.budget || 0);
  
  const backgroundColors = [
    '#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545',
    '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'
  ];

  if (budgetChartInstance) {
    budgetChartInstance.destroy();
  }

  budgetChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors.slice(0, categories.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              if (label) {
                label += ': ';
              }
              if (context.raw !== null) {
                label += window.formatRupiah(context.raw);
              }
              return label;
            }
          }
        }
      }
    }
  });
}

function renderCategoryProgress(budget) {
  const container = document.getElementById('category-progress-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const categories = typeof window.getCategories === 'function' ? window.getCategories() : [];
  const spentByCategory = typeof window.getSpentByCategory === 'function' ? window.getSpentByCategory() : {};

  if (categories.length === 0) {
    container.innerHTML = '<p class="text-muted small">Belum ada kategori budget.</p>';
    return;
  }

  categories.forEach(category => {
    const isSavings = !!(category.isSavings || category.is_savings);
    const spent = spentByCategory[category.id] || 0;
    const catBudget = category.budget || 0;
    const percentage = typeof window.calcPercentage === 'function' 
      ? window.calcPercentage(spent, catBudget) 
      : (catBudget > 0 ? Math.round((spent / catBudget) * 100) : 0);
      
    const colorClass = typeof window.getProgressColor === 'function' 
      ? window.getProgressColor(percentage, isSavings) 
      : (percentage > 100 ? 'bg-danger' : 'bg-primary');

    const savingsBadge = isSavings
      ? '<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill small ms-1" style="font-size: 0.75rem;"><i class="bi bi-piggy-bank me-1"></i>Tabungan</span>'
      : '';
    
    const div = document.createElement('div');
    div.className = 'mb-3 category-progress';
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-end mb-1">
        <span class="fw-medium">${category.name} ${savingsBadge}</span>
        <small class="text-muted">${window.formatRupiahShort ? window.formatRupiahShort(spent) : window.formatRupiah(spent)} / ${window.formatRupiahShort ? window.formatRupiahShort(catBudget) : window.formatRupiah(catBudget)}</small>
      </div>
      <div class="progress progress-budgetku" style="height: 10px;">
        <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${Math.min(percentage, 100)}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderDailyExpenseChart(budget) {
  const canvas = document.getElementById('dailyExpenseChart');
  if (!canvas) return;

  const currentMonthStr = budget.month || (typeof window.getCurrentMonth === 'function' ? window.getCurrentMonth() : '2026-08');
  const [yearStr, monthStr] = currentMonthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const labels = [];
  const dailyTotals = Array(daysInMonth).fill(0);
  
  for (let d = 1; d <= daysInMonth; d++) {
    labels.push(`${d}`);
  }
  
  const allTransactions = typeof window.getTransactions === 'function' ? window.getTransactions() : [];
  const expenseTransactions = allTransactions.filter(txn => {
    const type = txn.type || 'expense';
    const isSystem = !!(txn.is_system || txn.isSystem);
    return type === 'expense' && !isSystem;
  });

  let maxSpent = 0;
  let maxDay = null;
  let totalMonthSpent = 0;
  
  expenseTransactions.forEach(txn => {
    if (!txn.date) return;
    const parts = txn.date.split('-');
    if (parts.length === 3 && parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month) {
      const day = parseInt(parts[2], 10);
      if (day >= 1 && day <= daysInMonth) {
        dailyTotals[day - 1] += (txn.amount || 0);
      }
    }
  });

  dailyTotals.forEach((amt, idx) => {
    totalMonthSpent += amt;
    if (amt > maxSpent) {
      maxSpent = amt;
      maxDay = idx + 1;
    }
  });

  const today = new Date();
  const isCurrentCalendarMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
  const daysCountForAvg = isCurrentCalendarMonth ? Math.max(today.getDate(), 1) : daysInMonth;
  const avgSpent = Math.round(totalMonthSpent / daysCountForAvg);

  const avgValEl = document.getElementById('daily-avg-val');
  if (avgValEl) avgValEl.textContent = window.formatRupiah(avgSpent);

  const maxValEl = document.getElementById('daily-max-val');
  if (maxValEl) {
    if (maxSpent > 0 && maxDay) {
      maxValEl.textContent = `Tgl ${maxDay} (${window.formatRupiah(maxSpent)})`;
    } else {
      maxValEl.textContent = '-';
    }
  }

  if (dailyChartInstance) {
    dailyChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(26, 86, 219, 0.28)');
  gradient.addColorStop(1, 'rgba(26, 86, 219, 0.01)');

  dailyChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Pengeluaran',
        data: dailyTotals,
        borderColor: '#1a56db',
        backgroundColor: gradient,
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#1a56db',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: dailyTotals.map(v => (v > 0 ? 4.5 : 2)),
        pointHoverRadius: 6.5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: function(items) {
              return `Tanggal ${items[0].label} ${window.formatMonth ? window.formatMonth(currentMonthStr) : currentMonthStr}`;
            },
            label: function(context) {
              return ` Pengeluaran: ${window.formatRupiah(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: 'Tanggal',
            color: '#64748b',
            font: { size: 11, weight: '500' }
          },
          ticks: {
            color: '#64748b',
            font: { size: 11 },
            maxTicksLimit: 16,
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#f1f5f9',
          },
          ticks: {
            color: '#64748b',
            font: { size: 11 },
            callback: function(value) {
              if (value >= 1000000) return (value / 1000000) + ' Jt';
              if (value >= 1000) return (value / 1000) + ' Rb';
              return value;
            }
          }
        }
      }
    }
  });
}

function renderRecentTransactions(budget) {
  const tbody = document.getElementById('recent-transactions-tbody');
  const noData = document.getElementById('no-transactions');
  const paginationContainer = document.getElementById('recent-pagination-container');
  const paginationInfo = document.getElementById('recent-pagination-info');
  const paginationUl = document.getElementById('recent-pagination-ul');
  
  if (!tbody || !noData) return;
  
  const transactions = typeof window.getTransactions === 'function' ? window.getTransactions() : [];
  
  if (transactions.length === 0) {
    tbody.innerHTML = '';
    noData.classList.remove('d-none');
    if (paginationContainer) paginationContainer.classList.add('d-none');
    return;
  }
  
  noData.classList.add('d-none');
  
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const totalPages = Math.ceil(sorted.length / recentItemsPerPage);
  if (recentCurrentPage > totalPages) recentCurrentPage = 1;
  
  const startIndex = (recentCurrentPage - 1) * recentItemsPerPage;
  const endIndex = Math.min(startIndex + recentItemsPerPage, sorted.length);
  const pageItems = sorted.slice(startIndex, endIndex);
  
  tbody.innerHTML = '';
  pageItems.forEach(txn => {
    const isIncome = txn.type === 'income';
    const isReallocation = txn.type === 'reallocation';
    let badgeHtml = '';
    let amountHtml = '';

    if (isIncome) {
      badgeHtml = `<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle"><i class="bi bi-arrow-down-left me-1"></i>Pemasukan</span>`;
      amountHtml = `<span class="text-success fw-bold font-monospace">+${window.formatRupiah(txn.amount)}</span>`;
    } else if (isReallocation) {
      badgeHtml = `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle"><i class="bi bi-arrow-left-right me-1"></i>Realokasi</span>`;
      amountHtml = `<span class="text-secondary fw-semibold font-monospace">↔ ${window.formatRupiah(txn.amount)}</span>`;
    } else {
      const category = typeof window.getCategoryById === 'function' ? window.getCategoryById(txn.categoryId) : null;
      const catName = category ? category.name : 'Uncategorized';
      badgeHtml = `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle">${catName}</span>`;
      amountHtml = `<span class="fw-medium font-monospace text-dark">-${window.formatRupiah(txn.amount)}</span>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-nowrap">${window.formatDateShort ? window.formatDateShort(txn.date) : txn.date}</td>
      <td>${badgeHtml}</td>
      <td>${txn.description || '-'}</td>
      <td class="text-end">${amountHtml}</td>
    `;
    tbody.appendChild(tr);
  });
  
  if (paginationContainer && paginationInfo && paginationUl) {
    if (sorted.length > recentItemsPerPage) {
      paginationContainer.classList.remove('d-none');
      paginationInfo.textContent = `Menampilkan ${startIndex + 1}-${endIndex} dari ${sorted.length} transaksi`;
      
      let paginationHtml = '';
      
      paginationHtml += `
        <li class="page-item ${recentCurrentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="event.preventDefault(); window.changeRecentPage(${recentCurrentPage - 1})" aria-label="Sebelumnya">
            <i class="bi bi-chevron-left"></i>
          </a>
        </li>
      `;
      
      for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
          <li class="page-item ${recentCurrentPage === i ? 'active' : ''}">
            <a class="page-link" href="#" onclick="event.preventDefault(); window.changeRecentPage(${i})">${i}</a>
          </li>
        `;
      }
      
      paginationHtml += `
        <li class="page-item ${recentCurrentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="event.preventDefault(); window.changeRecentPage(${recentCurrentPage + 1})" aria-label="Selanjutnya">
            <i class="bi bi-chevron-right"></i>
          </a>
        </li>
      `;
      
      paginationUl.innerHTML = paginationHtml;
    } else {
      paginationContainer.classList.add('d-none');
    }
  }
}

window.changeRecentPage = function(page) {
  const transactions = typeof window.getTransactions === 'function' ? window.getTransactions() : [];
  const totalPages = Math.ceil(transactions.length / recentItemsPerPage);
  if (page < 1 || page > totalPages) return;
  recentCurrentPage = page;
  renderRecentTransactions();
};
