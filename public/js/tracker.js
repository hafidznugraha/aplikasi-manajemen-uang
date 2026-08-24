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
    formCategory.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    filterCategory.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    editCategory.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
}

function handleCategoryChange() {
  const catId = formCategory.value;
  updateSubcategoryDropdown(catId, formSubcategory);
}

function handleEditCategoryChange() {
  const catId = editCategory.value;
  updateSubcategoryDropdown(catId, editSubcategory);
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
  formSubcategory.innerHTML = '<option value="">Tidak ada sub-kategori</option>';
  removeFile();
}

async function submitTransaction() {
  const date = document.getElementById('txn-date').value;
  const categoryId = formCategory.value;
  const subcategoryId = formSubcategory.value;
  const description = document.getElementById('txn-desc').value;
  const amount = parseRupiah(document.getElementById('txn-amount').value);
  
  if (amount <= 0) {
    alert('Nominal harus lebih dari 0');
    return;
  }
  
  const txnData = {
    date,
    categoryId,
    subcategoryId: subcategoryId || null,
    description,
    amount,
  };
  
  await addTransaction(txnData, currentFile);
  
  resetForm();
  
  // Hide form collapse using Bootstrap API
  const bsCollapse = bootstrap.Collapse.getInstance(document.getElementById('formPengeluaran'));
  if (bsCollapse) bsCollapse.hide();
  
  loadTransactions();
  
  // Trigger update event for dashboard/budget sync if needed (app.js handles global state if any)
  if (window.updateGlobalState) window.updateGlobalState();
}

function loadTransactions() {
  currentTransactions = getTransactions();
  applyFilters();
}

function applyFilters() {
  const catFilter = filterCategory.value;
  const dateStart = document.getElementById('filter-date-start').value;
  const dateEnd = document.getElementById('filter-date-end').value;
  
  filteredTransactions = currentTransactions.filter(txn => {
    let match = true;
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
    const category = getCategoryById(txn.categoryId);
    const catName = category ? category.name : 'Unknown';
    
    let subName = '';
    if (txn.subcategoryId && category) {
      const sub = category.subcategories.find(s => s.id === txn.subcategoryId);
      if (sub) subName = `<div class="small text-muted">${sub.name}</div>`;
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
      <td class="ps-4">${formatDateShort(txn.date)}</td>
      <td>
        <div class="fw-medium">${catName}</div>
        ${subName}
      </td>
      <td>${txn.description}</td>
      <td class="text-end fw-medium">${formatRupiah(txn.amount)}</td>
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
  document.getElementById('edit-txn-date').value = txn.date;
  document.getElementById('edit-txn-desc').value = txn.description;
  
  const amountInput = document.getElementById('edit-txn-amount');
  amountInput.value = txn.amount;
  formatInputRupiah(amountInput);
  
  editCategory.value = txn.categoryId;
  handleEditCategoryChange();
  
  if (txn.subcategoryId) {
    editSubcategory.value = txn.subcategoryId;
  }
  
  document.getElementById('editTxnDialog').showModal();
}

function closeEditDialog() {
  document.getElementById('editTxnDialog').close();
}

async function submitEditTransaction() {
  const id = document.getElementById('edit-txn-id').value;
  const date = document.getElementById('edit-txn-date').value;
  const categoryId = editCategory.value;
  const subcategoryId = editSubcategory.value;
  const description = document.getElementById('edit-txn-desc').value;
  const amount = parseRupiah(document.getElementById('edit-txn-amount').value);
  
  if (amount <= 0) {
    alert('Nominal harus lebih dari 0');
    return;
  }
  
  await updateTransaction(id, {
    date,
    categoryId,
    subcategoryId: subcategoryId || null,
    description,
    amount
  });
  
  closeEditDialog();
  loadTransactions();
}

// Delete Dialog
let txnToDelete = null;

function confirmDelete(txnId) {
  txnToDelete = txnId;
  const dialog = document.getElementById('deleteConfirmDialog');
  
  document.getElementById('btn-confirm-delete').onclick = async () => {
    if (txnToDelete) {
      await deleteTransaction(txnToDelete);
      txnToDelete = null;
      dialog.close();
      loadTransactions();
    }
  };
  
  dialog.showModal();
}

function closeDeleteDialog() {
  txnToDelete = null;
  document.getElementById('deleteConfirmDialog').close();
}
