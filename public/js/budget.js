let totalBudgetInput;
let categoriesContainer;
let emptyStateCategories;
let btnAddCategoryTop;
let allocatedText;
let allocationBadge;
let allocationProgress;
let categoryModal;
let categoryForm;
let deleteConfirmModal;
let currentDeleteId = null;

window.initBudget = function() {
  totalBudgetInput = document.getElementById('total-budget-input');
  categoriesContainer = document.getElementById('categories-container');
  emptyStateCategories = document.getElementById('empty-state-categories');
  btnAddCategoryTop = document.getElementById('btn-add-category-top');
  allocatedText = document.getElementById('allocated-text');
  allocationBadge = document.getElementById('allocation-badge');
  allocationProgress = document.getElementById('allocation-progress');
  categoryModal = document.getElementById('category-modal');
  categoryForm = document.getElementById('category-form');
  deleteConfirmModal = document.getElementById('delete-confirm-modal');

  setupEventListeners();
  renderTotalBudget();
  renderCategories();
  updateAllocationSummary();
};

function setupEventListeners() {
  totalBudgetInput.addEventListener('input', (e) => {
    window.formatInputRupiah(e.target);
  });

  totalBudgetInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSetBudget();
    }
  });

  const btnSetBudget = document.getElementById('btn-set-budget');
  if (btnSetBudget) {
    btnSetBudget.addEventListener('click', handleSetBudget);
  }

  if (btnAddCategoryTop) {
    btnAddCategoryTop.addEventListener('click', openAddCategoryModal);
  }
  
  const btnAddCategoryEmpty = document.getElementById('btn-add-category-empty');
  if (btnAddCategoryEmpty) {
    btnAddCategoryEmpty.addEventListener('click', openAddCategoryModal);
  }
  
  // Modal listeners
  document.getElementById('btn-cancel-cat-modal').addEventListener('click', closeCategoryModal);
  document.getElementById('btn-save-cat-modal').addEventListener('click', saveCategoryFromModal);
  document.getElementById('btn-add-subcat').addEventListener('click', () => addSubcatInputRow());

  document.getElementById('cat-budget-input').addEventListener('input', (e) => {
    window.formatInputRupiah(e.target);
  });

  // Delete modal
  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    deleteConfirmModal.close();
    currentDeleteId = null;
  });
  document.getElementById('btn-confirm-delete').addEventListener('click', confirmDeleteCategory);
}

function renderTotalBudget() {
  const budget = window.getBudget();
  if (budget && budget.totalBudget > 0) {
    totalBudgetInput.value = window.formatRupiah(budget.totalBudget).replace('Rp ', '');
  } else {
    totalBudgetInput.value = '';
  }
}

async function handleSetBudget() {
  const btn = document.getElementById('btn-set-budget');
  const amountStr = totalBudgetInput.value;
  const amount = window.parseRupiah(amountStr);

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
  }

  await window.updateTotalBudget(amount);
  updateAllocationSummary();

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Tersimpan!';
    setTimeout(() => {
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Set';
    }, 2000);
  }

  const feedback = document.getElementById('budget-saved-feedback');
  if (feedback) {
    feedback.classList.remove('d-none');
    setTimeout(() => {
      feedback.classList.add('d-none');
    }, 3500);
  }
}

const debounceUpdateCategoryBudget = window.debounce((catId, inputEl) => {
  const amount = window.parseRupiah(inputEl.value);
  window.updateCategory(catId, { budget: amount });
  updateAllocationSummary();
}, 500);

function renderCategories() {
  const categories = window.getCategories();
  
  if (categories.length === 0) {
    emptyStateCategories.classList.remove('d-none');
    if (btnAddCategoryTop) btnAddCategoryTop.classList.add('d-none');
    categoriesContainer.innerHTML = '';
    return;
  }
  
  emptyStateCategories.classList.add('d-none');
  if (btnAddCategoryTop) btnAddCategoryTop.classList.remove('d-none');
  categoriesContainer.innerHTML = '';

  categories.forEach(cat => {
    const hasSubcats = cat.subcategories && cat.subcategories.length > 0;
    
    const row = document.createElement('div');
    row.className = 'category-item-card p-3 mb-3 bg-white';
    
    const catHeader = document.createElement('div');
    catHeader.className = 'd-flex align-items-center justify-content-between flex-wrap flex-md-nowrap gap-3';
    
    // Left: Icon / Toggle + Category Name & Subcount Badge
    const leftCol = document.createElement('div');
    leftCol.className = 'd-flex align-items-center gap-3 flex-grow-1 min-w-0';
    
    const isSavings = !!(cat.isSavings || cat.is_savings);

    if (hasSubcats) {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center border text-primary shadow-none p-0';
      toggleBtn.style.width = '36px';
      toggleBtn.style.height = '36px';
      toggleBtn.style.flexShrink = '0';
      toggleBtn.setAttribute('data-bs-toggle', 'collapse');
      toggleBtn.setAttribute('data-bs-target', `#subcat-collapse-${cat.id}`);
      toggleBtn.setAttribute('title', 'Buka/Tutup Sub-Kategori');
      toggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
      
      toggleBtn.addEventListener('click', function() {
        const icon = this.querySelector('i');
        if (icon.classList.contains('bi-chevron-right')) {
          icon.classList.replace('bi-chevron-right', 'bi-chevron-down');
        } else {
          icon.classList.replace('bi-chevron-down', 'bi-chevron-right');
        }
      });
      leftCol.appendChild(toggleBtn);
    } else {
      const iconBox = document.createElement('div');
      iconBox.className = isSavings
        ? 'category-icon-box bg-success-subtle text-success rounded-circle'
        : 'category-icon-box bg-primary-subtle text-primary rounded-circle';
      iconBox.style.width = '36px';
      iconBox.style.height = '36px';
      iconBox.innerHTML = isSavings ? '<i class="bi bi-piggy-bank-fill small"></i>' : '<i class="bi bi-tag-fill small"></i>';
      leftCol.appendChild(iconBox);
    }
    
    const nameWrapper = document.createElement('div');
    nameWrapper.className = 'd-flex align-items-center gap-2 flex-wrap';
    
    const catName = document.createElement('span');
    catName.className = 'fw-bold text-dark fs-6';
    catName.textContent = cat.name;
    nameWrapper.appendChild(catName);

    if (isSavings) {
      const savingsBadge = document.createElement('span');
      savingsBadge.className = 'badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill small fw-semibold';
      savingsBadge.innerHTML = '<i class="bi bi-piggy-bank me-1"></i>Tabungan';
      nameWrapper.appendChild(savingsBadge);
    }
    
    if (hasSubcats) {
      const badge = document.createElement('span');
      badge.className = 'badge bg-light text-secondary border rounded-pill small fw-normal';
      badge.innerHTML = `<i class="bi bi-diagram-2 me-1"></i>${cat.subcategories.length} sub`;
      nameWrapper.appendChild(badge);
    }
    leftCol.appendChild(nameWrapper);
    
    // Right: Readonly Formatted Amount Badge + Edit/Delete Buttons
    const rightCol = document.createElement('div');
    rightCol.className = 'd-flex align-items-center gap-3 ms-auto flex-shrink-0';
    
    const amountBadge = document.createElement('div');
    amountBadge.className = 'category-amount-badge fw-bold text-dark font-monospace px-3 py-1 rounded-2';
    amountBadge.textContent = window.formatRupiah(cat.budget);
    rightCol.appendChild(amountBadge);
    
    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group btn-group-sm';
    
    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn btn-outline-secondary';
    btnEdit.innerHTML = '<i class="bi bi-pencil"></i>';
    btnEdit.setAttribute('title', 'Edit Kategori');
    btnEdit.addEventListener('click', () => openEditCategoryModal(cat.id));
    
    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn btn-outline-danger';
    btnDelete.innerHTML = '<i class="bi bi-trash"></i>';
    btnDelete.setAttribute('title', 'Hapus Kategori');
    btnDelete.addEventListener('click', () => confirmDeleteRequest(cat.id, cat.name));
    
    btnGroup.appendChild(btnEdit);
    btnGroup.appendChild(btnDelete);
    rightCol.appendChild(btnGroup);
    
    catHeader.appendChild(leftCol);
    catHeader.appendChild(rightCol);
    row.appendChild(catHeader);
    
    // Subcategories Collapse Drawer
    if (hasSubcats) {
      const collapseDiv = document.createElement('div');
      collapseDiv.className = 'collapse mt-3 pt-3 border-top';
      collapseDiv.id = `subcat-collapse-${cat.id}`;
      
      const subContainer = document.createElement('div');
      subContainer.className = 'subcategories-container';
      
      const subTitle = document.createElement('div');
      subTitle.className = 'text-muted small fw-semibold mb-2 d-flex align-items-center';
      subTitle.innerHTML = '<i class="bi bi-diagram-2 me-1 text-primary"></i> Rincian Sub-Kategori:';
      subContainer.appendChild(subTitle);
      
      const subList = document.createElement('div');
      subList.className = 'd-flex flex-column gap-2';
      
      cat.subcategories.forEach(sub => {
        const subItem = document.createElement('div');
        subItem.className = 'subcat-item d-flex align-items-center justify-content-between';
        
        const subName = document.createElement('span');
        subName.className = 'text-secondary fw-medium small';
        subName.innerHTML = `<i class="bi bi-arrow-return-right me-2 text-primary"></i>${sub.name}`;
        
        const subVal = document.createElement('span');
        subVal.className = 'fw-semibold text-dark small font-monospace';
        subVal.textContent = window.formatRupiah(sub.budget);
        
        subItem.appendChild(subName);
        subItem.appendChild(subVal);
        subList.appendChild(subItem);
      });
      
      subContainer.appendChild(subList);
      collapseDiv.appendChild(subContainer);
      row.appendChild(collapseDiv);
    }
    
    categoriesContainer.appendChild(row);
  });
}

function updateAllocationSummary() {
  const budgetData = window.getBudget();
  const baselineBudget = budgetData.totalBudget || 0;
  const totalIncome = typeof window.getTotalIncome === 'function' ? window.getTotalIncome() : 0;
  const totalCapacity = baselineBudget + totalIncome;
  
  const allocated = (budgetData.categories || []).reduce((sum, cat) => sum + (cat.budget || 0), 0);
  
  if (totalIncome > 0) {
    allocatedText.innerHTML = `${window.formatRupiah(allocated)} / ${window.formatRupiah(totalCapacity)} <small class="text-success fw-normal" style="font-size: 0.82rem;">(termasuk tambahan ${window.formatRupiah(totalIncome)})</small>`;
  } else {
    allocatedText.textContent = `${window.formatRupiah(allocated)} / ${window.formatRupiah(baselineBudget)}`;
  }
  
  let percentage = 0;
  if (totalCapacity > 0) {
    percentage = (allocated / totalCapacity) * 100;
  } else if (allocated > 0) {
    percentage = 100;
  }
  
  allocationProgress.style.width = `${Math.min(percentage, 100)}%`;
  
  allocationProgress.className = 'progress-bar';
  allocationBadge.className = 'badge';
  
  if (allocated > totalCapacity && totalCapacity > 0) {
    allocationProgress.classList.add('bg-danger');
    allocationBadge.classList.add('bg-danger');
    allocationBadge.textContent = 'Over Budget';
  } else if (allocated > totalCapacity && totalCapacity === 0) {
    allocationProgress.classList.add('bg-danger');
    allocationBadge.classList.add('bg-danger');
    allocationBadge.textContent = 'Over Budget';
  } else if (Math.round(percentage) === 100) {
    allocationProgress.classList.add('bg-success');
    allocationBadge.classList.add('bg-success');
    allocationBadge.textContent = 'Alokasi Pas';
  } else {
    allocationProgress.classList.add('bg-primary');
    allocationBadge.classList.add('bg-primary');
    allocationBadge.textContent = 'Sesuai Budget';
  }
}

// Modal functions
function updateCategoryBudgetFromSubcats() {
  const subcatRows = document.querySelectorAll('.subcat-input-row');
  const catBudgetInput = document.getElementById('cat-budget-input');
  const catBudgetHelper = document.getElementById('cat-budget-auto-helper');

  if (!catBudgetInput) return;

  if (subcatRows.length > 0) {
    // Ada 1 atau lebih sub-kategori: Kunci input menjadi readonly & auto-sum
    catBudgetInput.readOnly = true;
    catBudgetInput.classList.add('bg-light');
    if (catBudgetHelper) {
      catBudgetHelper.classList.remove('d-none');
    }

    let total = 0;
    subcatRows.forEach(row => {
      const budgetInput = row.querySelector('.subcat-budget');
      if (budgetInput) {
        total += window.parseRupiah(budgetInput.value) || 0;
      }
    });

    catBudgetInput.value = window.formatRupiah(total).replace('Rp ', '');
  } else {
    // Tidak ada sub-kategori: Buka kunci manual
    catBudgetInput.readOnly = false;
    catBudgetInput.classList.remove('bg-light');
    if (catBudgetHelper) {
      catBudgetHelper.classList.add('d-none');
    }
  }
}

function openAddCategoryModal() {
  document.getElementById('category-modal-title').textContent = 'Tambah Kategori';
  document.getElementById('cat-id-input').value = '';
  document.getElementById('cat-name-input').value = '';
  document.getElementById('cat-budget-input').value = '';
  const isSavingsCheck = document.getElementById('cat-is-savings');
  if (isSavingsCheck) isSavingsCheck.checked = false;
  document.getElementById('subcat-list-container').innerHTML = '';
  
  document.getElementById('cat-name-input').classList.remove('is-invalid');
  document.getElementById('cat-budget-input').classList.remove('is-invalid');
  
  updateCategoryBudgetFromSubcats();
  categoryModal.showModal();
}

function openEditCategoryModal(catId) {
  const cat = window.getCategoryById(catId);
  if (!cat) return;
  
  document.getElementById('category-modal-title').textContent = 'Edit Kategori';
  document.getElementById('cat-id-input').value = cat.id;
  document.getElementById('cat-name-input').value = cat.name;
  document.getElementById('cat-budget-input').value = window.formatRupiah(cat.budget).replace('Rp ', '');
  
  const isSavingsCheck = document.getElementById('cat-is-savings');
  if (isSavingsCheck) {
    isSavingsCheck.checked = !!(cat.isSavings || cat.is_savings);
  }

  const subcatContainer = document.getElementById('subcat-list-container');
  subcatContainer.innerHTML = '';
  
  if (cat.subcategories && cat.subcategories.length > 0) {
    cat.subcategories.forEach(sub => {
      addSubcatInputRow(sub.name, sub.budget, sub.id);
    });
  }
  
  document.getElementById('cat-name-input').classList.remove('is-invalid');
  document.getElementById('cat-budget-input').classList.remove('is-invalid');
  
  updateCategoryBudgetFromSubcats();
  categoryModal.showModal();
}

function closeCategoryModal() {
  categoryModal.close();
}

function addSubcatInputRow(name = '', budget = 0, id = null) {
  const container = document.getElementById('subcat-list-container');
  const row = document.createElement('div');
  row.className = 'd-flex gap-2 mb-2 subcat-input-row';
  if (id) {
    row.dataset.subId = id;
  }
  
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'form-control subcat-name';
  nameInput.placeholder = 'Nama Subkategori';
  nameInput.value = name;
  
  const budgetInput = document.createElement('input');
  budgetInput.type = 'text';
  budgetInput.className = 'form-control subcat-budget text-end';
  budgetInput.placeholder = '0';
  if (budget > 0) {
    budgetInput.value = window.formatRupiah(budget).replace('Rp ', '');
  }
  
  budgetInput.addEventListener('input', (e) => {
    window.formatInputRupiah(e.target);
    updateCategoryBudgetFromSubcats();
  });
  budgetInput.addEventListener('keyup', () => {
    updateCategoryBudgetFromSubcats();
  });
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-outline-danger';
  removeBtn.innerHTML = '<i class="bi bi-x"></i>';
  removeBtn.addEventListener('click', () => {
    row.remove();
    updateCategoryBudgetFromSubcats();
  });
  
  row.appendChild(nameInput);
  row.appendChild(budgetInput);
  row.appendChild(removeBtn);
  
  container.appendChild(row);
  updateCategoryBudgetFromSubcats();
}

async function saveCategoryFromModal() {
  const saveBtn = document.getElementById('btn-save-cat-modal');
  const cancelBtn = document.getElementById('btn-cancel-cat-modal');
  const nameInput = document.getElementById('cat-name-input');
  const budgetInput = document.getElementById('cat-budget-input');
  const isSavingsInput = document.getElementById('cat-is-savings');
  
  let isValid = true;
  
  if (!nameInput.value.trim()) {
    nameInput.classList.add('is-invalid');
    isValid = false;
  } else {
    nameInput.classList.remove('is-invalid');
  }
  
  const budgetVal = window.parseRupiah(budgetInput.value) || 0;
  if (budgetVal < 0) {
    budgetInput.classList.add('is-invalid');
    isValid = false;
  } else {
    budgetInput.classList.remove('is-invalid');
  }
  
  const subcatRows = document.querySelectorAll('.subcat-input-row');
  const subcategories = [];
  
  subcatRows.forEach(row => {
    const sNameInput = row.querySelector('.subcat-name');
    const sName = sNameInput.value.trim();
    const sBudg = window.parseRupiah(row.querySelector('.subcat-budget').value) || 0;
    
    if (!sName) {
      sNameInput.classList.add('is-invalid');
      isValid = false;
    } else {
      sNameInput.classList.remove('is-invalid');
      subcategories.push({
        id: row.dataset.subId || window.generateId('sub'),
        name: sName,
        budget: sBudg
      });
    }
  });
  
  if (!isValid) return;

  const isSavings = isSavingsInput ? isSavingsInput.checked : false;

  // Tampilkan animasi loading & disable tombol agar tidak diklik ganda
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
  }
  if (cancelBtn) cancelBtn.disabled = true;
  
  try {
    const catId = document.getElementById('cat-id-input').value;
    if (catId) {
      await window.updateCategory(catId, {
        name: nameInput.value.trim(),
        budget: budgetVal,
        subcategories: subcategories,
        is_savings: isSavings,
        isSavings: isSavings,
      });
    } else {
      await window.addCategory(nameInput.value.trim(), budgetVal, subcategories, isSavings);
    }
    
    closeCategoryModal();
    renderCategories();
    updateAllocationSummary();
  } catch (err) {
    console.error('Error saat menyimpan kategori:', err);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Simpan';
    }
    if (cancelBtn) cancelBtn.disabled = false;
  }
}

function confirmDeleteRequest(catId, catName) {
  currentDeleteId = catId;
  document.getElementById('delete-confirm-text').textContent = `Apakah Anda yakin ingin menghapus kategori "${catName}"?`;
  deleteConfirmModal.showModal();
}

async function confirmDeleteCategory() {
  const confirmBtn = document.getElementById('btn-confirm-delete');
  const cancelBtn = document.getElementById('btn-cancel-delete');

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menghapus...';
  }
  if (cancelBtn) cancelBtn.disabled = true;

  try {
    if (currentDeleteId) {
      await window.deleteCategory(currentDeleteId);
      renderCategories();
      updateAllocationSummary();
    }
  } catch (err) {
    console.error('Error saat menghapus kategori:', err);
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = 'Hapus';
    }
    if (cancelBtn) cancelBtn.disabled = false;
    deleteConfirmModal.close();
    currentDeleteId = null;
  }
}
