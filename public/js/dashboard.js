let budgetChartInstance = null;

function initDashboard() {
  const budget = getBudget();
  const setupAlert = document.getElementById('setup-alert');
  const emptyState = document.getElementById('empty-state');
  const dashboardContent = document.getElementById('dashboard-content');

  if (!budget || budget.totalBudget === 0) {
    setupAlert.classList.remove('d-none');
    emptyState.classList.remove('d-none');
    dashboardContent.classList.add('d-none');
    return;
  }

  setupAlert.classList.add('d-none');
  emptyState.classList.add('d-none');
  dashboardContent.classList.remove('d-none');

  renderSummaryCards(budget);
  renderChart(budget);
  renderCategoryProgress(budget);
  renderRecentTransactions(budget);
}

function renderSummaryCards(budget) {
  const totalSpent = getTotalSpent();
  const remaining = budget.totalBudget - totalSpent;

  document.getElementById('total-budget').textContent = formatRupiah(budget.totalBudget);
  document.getElementById('total-spent').textContent = formatRupiah(totalSpent);
  
  const remainingEl = document.getElementById('total-remaining');
  remainingEl.textContent = formatRupiah(remaining);
  
  const remainingCard = document.getElementById('remaining-card');
  if (remaining < 0) {
    remainingCard.classList.add('card-remaining', 'overbudget');
    const iconBox = remainingCard.querySelector('.icon-box');
    if (iconBox) {
        iconBox.classList.remove('bg-success', 'text-success');
        iconBox.classList.add('bg-danger', 'text-danger');
    }
  } else {
    remainingCard.classList.remove('overbudget');
    const iconBox = remainingCard.querySelector('.icon-box');
    if (iconBox) {
        iconBox.classList.remove('bg-danger', 'text-danger');
        iconBox.classList.add('bg-success', 'text-success');
    }
  }
}

function renderChart(budget) {
  const ctx = document.getElementById('budgetChart');
  if (!ctx) return;

  const categories = getCategories();
  if (categories.length === 0) return;

  const labels = categories.map(c => c.name);
  const data = categories.map(c => c.budget);
  
  // Custom colors for chart
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
                label += formatRupiah(context.raw);
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
  
  const categories = getCategories();
  const spentByCategory = getSpentByCategory();

  if (categories.length === 0) {
    container.innerHTML = '<p class="text-muted">Belum ada kategori.</p>';
    return;
  }

  categories.forEach(category => {
    const spent = spentByCategory[category.id] || 0;
    const catBudget = category.budget || 0;
    const percentage = calcPercentage(spent, catBudget);
    const colorClass = getProgressColor(percentage);
    
    const div = document.createElement('div');
    div.className = 'mb-3 category-progress';
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-end mb-1">
        <span class="fw-medium">${category.name}</span>
        <small class="text-muted">${formatRupiahShort(spent)} / ${formatRupiahShort(catBudget)}</small>
      </div>
      <div class="progress progress-budgetku" style="height: 10px;">
        <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${Math.min(percentage, 100)}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderRecentTransactions(budget) {
  const tbody = document.getElementById('recent-transactions-tbody');
  const noData = document.getElementById('no-transactions');
  
  if (!tbody || !noData) return;
  
  const transactions = getTransactions();
  
  if (transactions.length === 0) {
    tbody.innerHTML = '';
    noData.classList.remove('d-none');
    return;
  }
  
  noData.classList.add('d-none');
  
  // Sort desc and take top 5
  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  
  tbody.innerHTML = '';
  recent.forEach(txn => {
    const category = getCategoryById(txn.categoryId);
    const catName = category ? category.name : 'Uncategorized';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDateShort(txn.date)}</td>
      <td><span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle">${catName}</span></td>
      <td>${txn.description || '-'}</td>
      <td class="text-end fw-medium">${formatRupiah(txn.amount)}</td>
    `;
    tbody.appendChild(tr);
  });
}
