let currentTransactions = [];
let filteredTransactions = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentFile = null;

// Form elements - initialized in initTracker()
let formCategory;
let formSubcategory;
let filterCategory;

// Edit Form elements
let editCategory;
let editSubcategory;

function initTracker() {
  formCategory = document.getElementById('txn-category');
  formSubcategory = document.getElementById('txn-subcategory');
  filterCategory = document.getElementById('filter-category');
  editCategory = document.getElementById('edit-txn-category');
  editSubcategory = document.getElementById('edit-txn-subcategory');

  document.getElementById('txn-date').value = getToday();
  populateCategorySelects();
  loadTransactions();
}

function populateCategorySelects() {
  const categories = getCategories();
  
  // Clear existing
  formCategory.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
  filterCategory.innerHTML = '<option value="">Semua Kategori</option>';
  editCategory.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';

  categories.forEach(cat => {
    const isSavings = !!(cat.isSavings || cat.is_savings);
    const suffix = isSavings ? ' 💰 (Tabungan)' : '';
    formCategory.innerHTML += `<option value="${cat.id}">${cat.name}${suffix}</option>`;
    filterCategory.innerHTML += `<option value="${cat.id}">${cat.name}${suffix}</option>`;
    editCategory.innerHTML += `<option value="${cat.id}">${cat.name}${suffix}</option>`;
  });
}

function handleTypeChange() {
  const isIncome = document.getElementById('type-income') ? document.getElementById('type-income').checked : false;
  const catCol = document.getElementById('category-col');
  const subcatCol = document.getElementById('subcategory-col');
  const catSelect = document.getElementById('txn-category');
  const descLabel = document.getElementById('txn-desc-label');
  const descInput = document.getElementById('txn-desc');
  const savingsContainer = document.getElementById('savings-confirmation-container');

  if (isIncome) {
    if (catCol) catCol.classList.add('d-none');
    if (subcatCol) subcatCol.classList.add('d-none');
    if (catSelect) {
      catSelect.required = false;
      catSelect.value = '';
    }
    if (descLabel) descLabel.textContent = 'Sumber Pemasukan / Keterangan';
    if (descInput) descInput.placeholder = 'Contoh: Gaji bulanan, Bonus proyek, Freelance';
    if (savingsContainer) savingsContainer.classList.add('d-none');
  } else {
    if (catCol) catCol.classList.remove('d-none');
    if (subcatCol) subcatCol.classList.remove('d-none');
    if (catSelect) catSelect.required = true;
    if (descLabel) descLabel.textContent = 'Keterangan';
    if (descInput) descInput.placeholder = 'Contoh: Makan siang, Bensin, Belanja';
    handleCategoryChange();
  }
}

function handleEditTypeChange() {
  const isIncome = document.getElementById('edit-type-income') ? document.getElementById('edit-type-income').checked : false;
  const catCol = document.getElementById('edit-category-col');
  const subcatRow = document.getElementById('edit-subcategory-row');
  const catSelect = document.getElementById('edit-txn-category');
  const savingsContainer = document.getElementById('edit-savings-confirmation-container');

  if (isIncome) {
    if (catCol) catCol.classList.add('d-none');
    if (subcatRow) {
      const subcatCol = subcatRow.querySelector('.col-md-6:first-child');
      if (subcatCol) subcatCol.classList.add('d-none');
    }
    if (catSelect) {
      catSelect.required = false;
      catSelect.value = '';
    }
    if (savingsContainer) savingsContainer.classList.add('d-none');
  } else {
    if (catCol) catCol.classList.remove('d-none');
    if (subcatRow) {
      const subcatCol = subcatRow.querySelector('.col-md-6:first-child');
      if (subcatCol) subcatCol.classList.remove('d-none');
    }
    if (catSelect) catSelect.required = true;
    handleEditCategoryChange();
  }
}

function handleCategoryChange() {
  const catId = formCategory.value;
  updateSubcategoryDropdown(catId, formSubcategory);

  const cat = getCategoryById(catId);
  const isSavings = cat && (cat.isSavings || cat.is_savings);
  const savingsContainer = document.getElementById('savings-confirmation-container');
  const savingsConfirm = document.getElementById('txn-savings-confirm');

  if (savingsContainer && savingsConfirm) {
    if (isSavings) {
      savingsContainer.classList.remove('d-none');
      savingsConfirm.checked = false;
      savingsConfirm.required = true;
    } else {
      savingsContainer.classList.add('d-none');
      savingsConfirm.checked = false;
      savingsConfirm.required = false;
    }
  }
}

function handleEditCategoryChange() {
  const catId = editCategory.value;
  updateSubcategoryDropdown(catId, editSubcategory);

  const cat = getCategoryById(catId);
  const isSavings = cat && (cat.isSavings || cat.is_savings);
  const savingsContainer = document.getElementById('edit-savings-confirmation-container');
  const savingsConfirm = document.getElementById('edit-txn-savings-confirm');

  if (savingsContainer && savingsConfirm) {
    if (isSavings) {
      savingsContainer.classList.remove('d-none');
      savingsConfirm.required = true;
    } else {
      savingsContainer.classList.add('d-none');
      savingsConfirm.checked = false;
      savingsConfirm.required = false;
    }
  }
}

function updateSubcategoryDropdown(categoryId, subcategorySelectElement) {
  subcategorySelectElement.innerHTML = '<option value="">Tidak ada sub-kategori</option>';
  
  if (!categoryId) return;
  
  const category = getCategoryById(categoryId);
  if (category && category.subcategories && category.subcategories.length > 0) {
    subcategorySelectElement.innerHTML = '<option value="">Pilih Sub-Kategori (Opsional)</option>';
    category.subcategories.forEach(sub => {
      subcategorySelectElement.innerHTML += `<option value="${sub.id}">${sub.name}</option>`;
    });
  }
}

// File Upload Logic
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.add('border-primary', 'bg-light');
}

function handleDragLeave(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('border-primary', 'bg-light');
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('border-primary', 'bg-light');
  
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    processFile(e.dataTransfer.files[0]);
  }
}

function handleFileSelect(e) {
  if (e.target.files && e.target.files.length > 0) {
    processFile(e.target.files[0]);
  }
}

function processFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    alert('Format file tidak didukung. Harap gunakan .jpg atau .png');
    return;
  }
  
  if (file.size > 1024 * 1024) {
    alert('Ukuran file terlalu besar. Maksimal 1MB.');
    return;
  }
  
  currentFile = file;
  
  // Show preview
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('preview-img').src = e.target.result;
    document.getElementById('preview-filename').textContent = file.name;
    document.getElementById('preview-filesize').textContent = (file.size / 1024).toFixed(1) + ' KB';
    
    document.getElementById('upload-zone').classList.add('d-none');
    document.getElementById('upload-preview').classList.remove('d-none');
    document.getElementById('upload-preview').classList.add('d-flex');
  }
  reader.readAsDataURL(file);
}

function removeFile(e) {
  if (e) e.stopPropagation();
  currentFile = null;
  document.getElementById('txn-receipt').value = '';
  
  document.getElementById('upload-zone').classList.remove('d-none');
  document.getElementById('upload-preview').classList.add('d-none');
  document.getElementById('upload-preview').classList.remove('d-flex');
}

function resetForm() {
  document.getElementById('add-transaction-form').reset();
  document.getElementById('txn-date').value = getToday();
  const typeExpense = document.getElementById('type-expense');
  if (typeExpense) typeExpense.checked = true;
  handleTypeChange();
  formSubcategory.innerHTML = '<option value="">Tidak ada sub-kategori</option>';
  const savingsContainer = document.getElementById('savings-confirmation-container');
  const savingsConfirm = document.getElementById('txn-savings-confirm');
  if (savingsContainer) savingsContainer.classList.add('d-none');
  if (savingsConfirm) {
    savingsConfirm.checked = false;
    savingsConfirm.required = false;
  }
  removeFile();
}

async function submitTransaction() {
  const submitBtn = document.querySelector('#add-transaction-form button[type="submit"]');
  const isIncome = document.getElementById('type-income') ? document.getElementById('type-income').checked : false;
  const type = isIncome ? 'income' : 'expense';
  const date = document.getElementById('txn-date').value;
  const categoryId = isIncome ? null : formCategory.value;
  const subcategoryId = isIncome ? null : (formSubcategory.value || null);
  const description = document.getElementById('txn-desc').value;
  const amount = parseRupiah(document.getElementById('txn-amount').value);
  
  if (amount <= 0) {
    alert('Nominal harus lebih dari 0');
    return;
  }

  if (type === 'expense') {
    if (!categoryId) {
      alert('Harap pilih kategori pengeluaran.');
      formCategory.focus();
      return;
    }
    const cat = getCategoryById(categoryId);
    const isSavings = cat && (cat.isSavings || cat.is_savings);
    const savingsConfirm = document.getElementById('txn-savings-confirm');
    if (isSavings && savingsConfirm && !savingsConfirm.checked) {
      alert('Harap centang konfirmasi alokasi tabungan terlebih dahulu.');
      savingsConfirm.focus();
      return;
    }

    // Hitung sisa saldo kategori saat ini
    const spentMap = getSpentByCategory();
    const currentSpent = spentMap[categoryId] || 0;
    const catBudget = cat ? (cat.budget || 0) : 0;
    const remaining = catBudget - currentSpent;
    const deficit = amount - remaining;

    // Jika minus/defisit, cegat dan tampilkan modal realokasi overbudget
    if (deficit > 0) {
      openOverbudgetModal({
        txnData: {
          type,
          date,
          categoryId,
          subcategoryId,
          description,
          amount,
        },
        file: currentFile,
        deficit,
        targetCat: cat,
        targetRemaining: remaining,
      });
      return;
    }
  }
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
  }

  const txnData = {
    type,
    date,
    categoryId,
    subcategoryId,
    description,
    amount,
  };
  
  try {
    await addTransaction(txnData, currentFile);
    resetForm();
    
    // Hide form collapse using Bootstrap API
    const bsCollapse = bootstrap.Collapse.getInstance(document.getElementById('formPengeluaran'));
    if (bsCollapse) bsCollapse.hide();
    
    loadTransactions();
    
    // Trigger update event for dashboard/budget sync if needed (app.js handles global state if any)
    if (window.updateGlobalState) window.updateGlobalState();
  } catch (err) {
    console.error('Error saat menyimpan transaksi:', err);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Simpan';
    }
  }
}

// -------------------------------------------------------------
// Overbudget Modal & Realokasi Saldo
// -------------------------------------------------------------
let pendingOverbudget = null;

function openOverbudgetModal(data) {
  pendingOverbudget = data;

  const targetNameEl = document.getElementById('overbudget-target-cat-name');
  const deficitEl = document.getElementById('overbudget-deficit-amount');
  const sourceSelect = document.getElementById('overbudget-source-cat');
  const confirmBtn = document.getElementById('btn-confirm-reallocate');
  const helpText = document.getElementById('overbudget-source-help');
  const previewBox = document.getElementById('overbudget-preview-box');

  if (targetNameEl) targetNameEl.textContent = data.targetCat ? data.targetCat.name : 'Kategori';
  if (deficitEl) deficitEl.textContent = formatRupiah(data.deficit);

  // Ambil semua kategori lain yang memiliki sisa saldo > 0
  const categories = getCategories();
  const spentMap = getSpentByCategory();
  const eligibleCategories = categories.filter(c => {
    if (c.id == data.targetCat.id) return false;
    const spent = spentMap[c.id] || 0;
    const rem = (c.budget || 0) - spent;
    return rem > 0;
  });

  sourceSelect.innerHTML = '';

  if (eligibleCategories.length === 0) {
    sourceSelect.innerHTML = '<option value="" disabled selected>Tidak ada kategori lain dengan sisa saldo positif</option>';
    if (confirmBtn) confirmBtn.disabled = true;
    if (helpText) helpText.textContent = 'Semua kategori lain telah habis atau tidak memiliki sisa saldo.';
    if (previewBox) previewBox.classList.add('d-none');
  } else {
    if (confirmBtn) confirmBtn.disabled = false;
    if (helpText) helpText.textContent = 'Pilih kategori yang masih memiliki sisa saldo positif untuk dipindahkan.';
    if (previewBox) previewBox.classList.remove('d-none');

    eligibleCategories.forEach((c, idx) => {
      const spent = spentMap[c.id] || 0;
      const rem = (c.budget || 0) - spent;
      sourceSelect.innerHTML += `<option value="${c.id}" ${idx === 0 ? 'selected' : ''}>${c.name} (Sisa: ${formatRupiah(rem)})</option>`;
    });

    handleOverbudgetSourceChange();
  }

  const modal = document.getElementById('overbudget-modal');
  if (modal) modal.showModal();
}

function handleOverbudgetSourceChange() {
  if (!pendingOverbudget) return;

  const sourceSelect = document.getElementById('overbudget-source-cat');
  const sourceCatId = sourceSelect.value;
  const sourceCat = getCategoryById(sourceCatId);
  if (!sourceCat) return;

  const spentMap = getSpentByCategory();
  const sourceSpent = spentMap[sourceCat.id] || 0;
  const sourceBudget = sourceCat.budget || 0;
  const sourceRem = sourceBudget - sourceSpent;
  const deficit = pendingOverbudget.deficit;

  const targetCat = pendingOverbudget.targetCat;
  const targetBudget = targetCat ? (targetCat.budget || 0) : 0;

  const newSourceBudget = Math.max(0, sourceBudget - deficit);
  const newTargetBudget = targetBudget + deficit;

  const previewSourceName = document.getElementById('preview-source-name');
  const previewSourceCalc = document.getElementById('preview-source-calc');
  const previewTargetName = document.getElementById('preview-target-name');
  const previewTargetCalc = document.getElementById('preview-target-calc');

  if (previewSourceName) previewSourceName.textContent = `${sourceCat.name} (Budget):`;
  if (previewSourceCalc) {
    previewSourceCalc.textContent = `${formatRupiah(sourceBudget)} → ${formatRupiah(newSourceBudget)} (Sisa: ${formatRupiah(Math.max(0, sourceRem - deficit))})`;
  }

  if (previewTargetName) previewTargetName.textContent = `${targetCat.name} (Budget):`;
  if (previewTargetCalc) {
    previewTargetCalc.textContent = `${formatRupiah(targetBudget)} → ${formatRupiah(newTargetBudget)}`;
  }
}

function closeOverbudgetDialog() {
  const modal = document.getElementById('overbudget-modal');
  if (modal) modal.close();
  pendingOverbudget = null;
}

async function confirmAndReallocate() {
  if (!pendingOverbudget) return;

  const sourceSelect = document.getElementById('overbudget-source-cat');
  const sourceCatId = sourceSelect.value;
  if (!sourceCatId) {
    alert('Harap pilih kategori sumber saldo.');
    return;
  }

  const confirmBtn = document.getElementById('btn-confirm-reallocate');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Memindahkan Saldo...';
  }

  try {
    const success = await reallocateCategoryBudget(
      sourceCatId,
      pendingOverbudget.targetCat.id,
      pendingOverbudget.deficit
    );

    if (success) {
      // Simpan transaksi setelah budget berhasil dialihkan
      await addTransaction(pendingOverbudget.txnData, pendingOverbudget.file);

      closeOverbudgetDialog();
      resetForm();

      const bsCollapse = bootstrap.Collapse.getInstance(document.getElementById('formPengeluaran'));
      if (bsCollapse) bsCollapse.hide();

      populateCategorySelects();
      loadTransactions();

      if (window.updateGlobalState) window.updateGlobalState();
    } else {
      alert('Gagal melakukan realokasi budget. Silakan coba lagi.');
    }
  } catch (err) {
    console.error('Error reallocate budget:', err);
    alert('Terjadi kesalahan saat memindahkan saldo.');
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="bi bi-arrow-left-right me-1"></i> Konfirmasi & Pindahkan Saldo';
    }
  }
}

function loadTransactions() {
  currentTransactions = getTransactions();
  applyFilters();
}

function applyFilters() {
  const typeFilter = document.getElementById('filter-type') ? document.getElementById('filter-type').value : '';
  const catFilter = filterCategory.value;
  const dateStart = document.getElementById('filter-date-start').value;
  const dateEnd = document.getElementById('filter-date-end').value;
  
  filteredTransactions = currentTransactions.filter(txn => {
    let match = true;
    const txnType = txn.type || 'expense';
    if (typeFilter && txnType !== typeFilter) match = false;
    if (catFilter && txn.categoryId !== catFilter) match = false;
    if (dateStart && txn.date < dateStart) match = false;
    if (dateEnd && txn.date > dateEnd) match = false;
    return match;
  });
  
  // Sort by date descending
  filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  currentPage = 1;
  renderTable();
}

function resetFilters() {
  const filterTypeEl = document.getElementById('filter-type');
  if (filterTypeEl) filterTypeEl.value = '';
  filterCategory.value = '';
  document.getElementById('filter-date-start').value = '';
  document.getElementById('filter-date-end').value = '';
  applyFilters();
}

async function renderTable() {
  const tbody = document.getElementById('transaction-tbody');
  const emptyState = document.getElementById('empty-state');
  const tableCard = document.querySelector('.table-transactions').closest('.card');
  const paginationNav = document.getElementById('pagination-nav');
  
  tbody.innerHTML = '';
  
  if (filteredTransactions.length === 0) {
    emptyState.classList.remove('d-none');
    tableCard.classList.add('d-none');
    paginationNav.classList.add('d-none');
    return;
  }
  
  emptyState.classList.add('d-none');
  tableCard.classList.remove('d-none');
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTransactions.length);
  const pageItems = filteredTransactions.slice(startIndex, endIndex);
  
  for (const txn of pageItems) {
    const isIncome = txn.type === 'income';
    let categoryHtml = '';
    let amountHtml = '';

    if (isIncome) {
      categoryHtml = `
        <span class="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill fw-semibold px-2 py-1">
          <i class="bi bi-arrow-down-left me-1"></i>Pemasukan
        </span>
      `;
      amountHtml = `<span class="text-success fw-bold font-monospace">+${formatRupiah(txn.amount)}</span>`;
    } else {
      const category = getCategoryById(txn.categoryId);
      const catName = category ? category.name : 'Umum';
      const isSavings = category && (category.isSavings || category.is_savings);
      
      let subName = '';
      if (txn.subcategoryId && category) {
        const sub = category.subcategories.find(s => s.id === txn.subcategoryId);
        if (sub) subName = `<div class="small text-muted">${sub.name}</div>`;
      }
      
      categoryHtml = `
        <div class="fw-medium text-dark d-flex align-items-center gap-1">
          <span>${catName}</span>
          ${isSavings ? '<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill small"><i class="bi bi-piggy-bank"></i></span>' : ''}
        </div>
        ${subName}
      `;
      amountHtml = `<span class="fw-bold font-monospace text-dark">-${formatRupiah(txn.amount)}</span>`;
    }
    
    let receiptHtml = '<span class="text-muted">—</span>';
    if (txn.hasReceipt) {
      const receiptUrl = await getReceiptURL(txn.id);
      if (receiptUrl) {
        receiptHtml = `<img src="${receiptUrl}" alt="Struk" class="rounded cursor-pointer" style="width: 40px; height: 40px; object-fit: cover;" onclick="showReceiptPreview('${txn.id}', '${receiptUrl}')">`;
      }
    }
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="ps-4 text-nowrap">${formatDateShort(txn.date)}</td>
      <td>${categoryHtml}</td>
      <td>${txn.description}</td>
      <td class="text-end">${amountHtml}</td>
      <td class="text-center">${receiptHtml}</td>
      <td class="text-end pe-4">
        <div class="btn-group">
          <button class="btn btn-sm btn-light" onclick="openEditDialog('${txn.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-light text-danger" onclick="confirmDelete('${txn.id}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  }
  
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginationNav = document.getElementById('pagination-nav');
  const ul = document.getElementById('pagination-ul');
  
  if (totalPages <= 1) {
    paginationNav.classList.add('d-none');
    return;
  }
  
  paginationNav.classList.remove('d-none');
  ul.innerHTML = '';
  
  // Prev button
  ul.innerHTML += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="event.preventDefault(); changePage(${currentPage - 1})">Sebelumnya</a>
    </li>
  `;
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    ul.innerHTML += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); changePage(${i})">${i}</a>
      </li>
    `;
  }
  
  // Next button
  ul.innerHTML += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="event.preventDefault(); changePage(${currentPage + 1})">Selanjutnya</a>
    </li>
  `;
}

function changePage(page) {
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable();
}

// Receipt Preview Dialog
function showReceiptPreview(txnId, url) {
  const txn = currentTransactions.find(t => t.id == txnId);
  if (!txn) return;
  
  const category = getCategoryById(txn.categoryId);
  
  document.getElementById('dialog-receipt-img').src = url;
  document.getElementById('dialog-receipt-date').textContent = formatDateLong(txn.date);
  document.getElementById('dialog-receipt-category').textContent = category ? category.name : '-';
  document.getElementById('dialog-receipt-desc').textContent = txn.description;
  document.getElementById('dialog-receipt-amount').textContent = formatRupiah(txn.amount);
  
  document.getElementById('receiptDialog').showModal();
}

// Edit Dialog
function openEditDialog(txnId) {
  const txn = currentTransactions.find(t => t.id == txnId);
  if (!txn) return;
  
  document.getElementById('edit-txn-id').value = txn.id;
  const isIncome = txn.type === 'income';
  const editTypeIncome = document.getElementById('edit-type-income');
  const editTypeExpense = document.getElementById('edit-type-expense');
  if (editTypeIncome && editTypeExpense) {
    editTypeIncome.checked = isIncome;
    editTypeExpense.checked = !isIncome;
  }
  handleEditTypeChange();

  document.getElementById('edit-txn-date').value = txn.date;
  document.getElementById('edit-txn-desc').value = txn.description;
  
  const amountInput = document.getElementById('edit-txn-amount');
  amountInput.value = txn.amount;
  formatInputRupiah(amountInput);
  
  if (!isIncome && txn.categoryId) {
    editCategory.value = txn.categoryId;
    handleEditCategoryChange();
    
    if (txn.subcategoryId) {
      editSubcategory.value = txn.subcategoryId;
    }
  }
  
  document.getElementById('editTxnDialog').showModal();
}

function closeEditDialog() {
  document.getElementById('editTxnDialog').close();
}

async function submitEditTransaction() {
  const saveBtn = document.querySelector('#editTxnDialog button[type="submit"]');
  const isIncome = document.getElementById('edit-type-income') ? document.getElementById('edit-type-income').checked : false;
  const type = isIncome ? 'income' : 'expense';
  const id = document.getElementById('edit-txn-id').value;
  const date = document.getElementById('edit-txn-date').value;
  const categoryId = isIncome ? null : editCategory.value;
  const subcategoryId = isIncome ? null : (editSubcategory.value || null);
  const description = document.getElementById('edit-txn-desc').value;
  const amount = parseRupiah(document.getElementById('edit-txn-amount').value);
  
  if (amount <= 0) {
    alert('Nominal harus lebih dari 0');
    return;
  }

  if (type === 'expense') {
    if (!categoryId) {
      alert('Harap pilih kategori pengeluaran.');
      editCategory.focus();
      return;
    }
    const cat = getCategoryById(categoryId);
    const isSavings = cat && (cat.isSavings || cat.is_savings);
    const savingsConfirm = document.getElementById('edit-txn-savings-confirm');
    if (isSavings && savingsConfirm && !savingsConfirm.checked) {
      alert('Harap centang konfirmasi alokasi tabungan terlebih dahulu.');
      savingsConfirm.focus();
      return;
    }
  }
  
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
  }

  try {
    await updateTransaction(id, {
      type,
      date,
      categoryId,
      subcategoryId,
      description,
      amount
    });
    
    closeEditDialog();
    loadTransactions();
  } catch (err) {
    console.error('Error saat mengubah transaksi:', err);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Simpan Perubahan';
    }
  }
}

// Delete Dialog
let txnToDelete = null;

function confirmDelete(txnId) {
  txnToDelete = txnId;
  const dialog = document.getElementById('deleteConfirmDialog');
  const deleteBtn = document.getElementById('btn-confirm-delete');
  
  deleteBtn.onclick = async () => {
    if (txnToDelete) {
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menghapus...';
      
      try {
        await deleteTransaction(txnToDelete);
        txnToDelete = null;
        dialog.close();
        loadTransactions();
      } catch (err) {
        console.error('Error saat menghapus transaksi:', err);
      } finally {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = 'Hapus';
      }
    }
  };
  
  dialog.showModal();
}

function closeDeleteDialog() {
  txnToDelete = null;
  document.getElementById('deleteConfirmDialog').close();
}

