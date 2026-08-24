let archiveChartInstance = null;
let currentArchiveEntry = null;

function initArsip() {
    renderArchiveCards();
    
    document.getElementById('btn-close-detail').addEventListener('click', closeDetail);
    document.getElementById('btn-export-csv').addEventListener('click', handleExportCSV);
}

function renderArchiveCards() {
    const archives = getArchive() || [];
    const container = document.getElementById('archive-cards-container');
    const emptyState = document.getElementById('archive-empty-state');
    
    container.innerHTML = '';
    
    if (archives.length === 0) {
        emptyState.classList.remove('d-none');
        return;
    }
    
    emptyState.classList.add('d-none');
    
    // Sort newest first based on month string 'YYYY-MM'
    archives.sort((a, b) => b.month.localeCompare(a.month));
    
    archives.forEach((archive, index) => {
        const col = document.createElement('div');
        col.className = 'col-sm-6 col-lg-3';
        
        const isHemat = archive.totalSpent <= archive.totalBudget;
        const badgeClass = isHemat ? 'badge-hemat text-success' : 'badge-over text-danger';
        const badgeText = isHemat ? 'Hemat' : 'Overbudget';
        const badgeIcon = isHemat ? 'bi-check-circle' : 'bi-exclamation-triangle';
        
        col.innerHTML = `
            <div class="card card-budgetku archive-card h-100" style="cursor: pointer;" data-month="${archive.month}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${formatMonth(archive.month)}</h5>
                    <div class="mt-2 mb-3">
                        <small class="text-muted d-block">Anggaran:</small>
                        <span class="fw-semibold">${formatRupiah(archive.totalBudget)}</span>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted d-block">Pengeluaran:</small>
                        <span class="fw-semibold">${formatRupiah(archive.totalSpent)}</span>
                    </div>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
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
    detailSection.classList.remove('d-none');
    
    document.getElementById('detail-month-title').textContent = `Detail: ${formatMonth(archive.month)}`;
    
    // Summary Cards
    document.getElementById('detail-total-budget').textContent = formatRupiah(archive.totalBudget);
    document.getElementById('detail-total-spent').textContent = formatRupiah(archive.totalSpent);
    
    const remaining = archive.totalBudget - archive.totalSpent;
    const remainingCard = document.getElementById('detail-remaining-card');
    document.getElementById('detail-total-remaining').textContent = formatRupiah(Math.abs(remaining));
    
    if (remaining < 0) {
        remainingCard.classList.add('overbudget');
        remainingCard.classList.remove('bg-light');
        document.getElementById('detail-total-remaining').textContent = '- ' + formatRupiah(Math.abs(remaining));
    } else {
        remainingCard.classList.remove('overbudget');
        document.getElementById('detail-total-remaining').textContent = formatRupiah(remaining);
    }
    
    renderChart(archive);
    renderProgressBars(archive);
    renderTransactionsTable(archive);
    
    // Scroll to detail section
    detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeDetail() {
    document.getElementById('archive-detail-section').classList.add('d-none');
    document.querySelectorAll('.archive-card').forEach(c => c.classList.remove('active', 'border-primary'));
    currentArchiveEntry = null;
}

function renderChart(archive) {
    const ctx = document.getElementById('archive-budget-chart').getContext('2d');
    
    if (archiveChartInstance) {
        archiveChartInstance.destroy();
    }
    
    const labels = [];
    const data = [];
    const backgroundColor = [
        '#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', 
        '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'
    ];
    
    archive.categories.forEach(cat => {
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
    container.innerHTML = '';
    
    // Calculate spent per category
    const spentByCategory = {};
    archive.categories.forEach(c => spentByCategory[c.id] = 0);
    
    if (archive.transactions) {
        archive.transactions.forEach(t => {
            if (t.type === 'income') return;
            if (spentByCategory[t.categoryId] !== undefined) {
                spentByCategory[t.categoryId] += t.amount;
            }
        });
    }
    
    if (archive.categories.length === 0) {
        container.innerHTML = '<p class="text-muted small">Tidak ada kategori anggaran.</p>';
        return;
    }
    
    archive.categories.forEach(cat => {
        const spent = spentByCategory[cat.id] || 0;
        const budget = cat.budget || 0;
        const percentage = calcPercentage(spent, budget);
        const colorClass = getProgressColor(percentage, !!(cat.isSavings || cat.is_savings));
        
        const div = document.createElement('div');
        div.className = 'category-progress mb-3';
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-end mb-1">
                <span class="fw-medium small">${cat.name} ${cat.isSavings || cat.is_savings ? '<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill small ms-1"><i class="bi bi-piggy-bank"></i></span>' : ''}</span>
                <span class="small text-muted">${formatRupiahShort(spent)} / ${formatRupiahShort(budget)}</span>
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
    tbody.innerHTML = '';
    
    if (!archive.transactions || archive.transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Tidak ada transaksi pada bulan ini.</td></tr>`;
        return;
    }
    
    // Sort by date descending
    const sortedTxns = [...archive.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTxns.forEach(txn => {
        const isIncome = txn.type === 'income';
        let catHtml = '';
        let amountHtml = '';

        if (isIncome) {
            catHtml = `<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle"><i class="bi bi-arrow-down-left me-1"></i>Pemasukan</span>`;
            amountHtml = `<span class="text-success fw-bold font-monospace">+${formatRupiah(txn.amount)}</span>`;
        } else {
            let catName = 'Uncategorized';
            let subCatName = '';
            
            const cat = archive.categories.find(c => c.id === txn.categoryId);
            if (cat) {
                catName = cat.name;
                if (txn.subcategoryId) {
                    const sub = cat.subcategories.find(s => s.id === txn.subcategoryId);
                    if (sub) {
                        subCatName = ` <span class="text-muted small">› ${sub.name}</span>`;
                    }
                }
            }
            catHtml = `<div>${catName}${subCatName}</div>`;
            amountHtml = `<span class="fw-medium font-monospace text-dark">-${formatRupiah(txn.amount)}</span>`;
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="fw-medium text-nowrap">${formatDateShort(txn.date)}</div>
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
        const csvContent = exportArchiveToCSV(currentArchiveEntry);
        const monthName = formatMonth(currentArchiveEntry.month).replace(' ', '-');
        const filename = 'BudgetKu_' + monthName + '.csv';
        downloadCSV(csvContent, filename);
    } catch (e) {
        console.error('Failed to export CSV:', e);
        alert('Gagal mengekspor CSV.');
    }
}
