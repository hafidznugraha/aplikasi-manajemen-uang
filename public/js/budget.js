let totalBudgetInput;
let categoriesContainer;
let emptyStateCategories;
let btnAddCategoryTop;
let addCategoryBottomContainer;
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
  addCategoryBottomContainer = document.getElementById('add-category-bottom-container');
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

  btnAddCategoryTop.addEventListener('click', openAddCategoryModal);
  document.getElementById('btn-add-category-bottom').addEventListener('click', openAddCategoryModal);
  document.getElementById('btn-add-category-empty').addEventListener('click', openAddCategoryModal);
  
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
    btnAddCategoryTop.classList.add('d-none');
    addCategoryBottomContainer.classList.add('d-none');
    categoriesContainer.innerHTML = '';
    return;
  }
  
  emptyStateCategories.classList.add('d-none');
  btnAddCategoryTop.classList.remove('d-none');
  addCategoryBottomContainer.classList.remove('d-none');
  categoriesContainer.innerHTML = '';

  categories.forEach(cat => {
    const hasSubcats = cat.subcategories && cat.subcategories.length > 0;
    
    const row = document.createElement('div');
    row.className = 'category-row p-3 border rounded mb-3 bg-white';
    
    const catHeader = document.createElement('div');
    catHeader.className = 'd-flex align-items-center justify-content-between gap-2 gap-md-3 flex-wrap flex-md-nowrap';
    
    const leftCol = document.createElement('div');
    leftCol.className = 'd-flex align-items-center gap-2 flex-grow-1';
    
    if (hasSubcats) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn btn-sm btn-link p-0 text-dark text-decoration-none';
      toggleBtn.innerHTML = '<i class="bi bi-caret-right-fill"></i>';
      toggleBtn.setAttribute('data-bs-toggle', 'collapse');
      toggleBtn.setAttribute('data-bs-target', `#subcat-collapse-${cat.id}`);
      
      toggleBtn.addEventListener('click', function() {
        const icon = this.querySelector('i');
        if (icon.classList.contains('bi-caret-right-fill')) {
          icon.classList.replace('bi-caret-right-fill', 'bi-caret-down-fill');
        } else {
          icon.classList.replace('bi-caret-down-fill', 'bi-caret-right-fill');
        }
      });
      
      leftCol.appendChild(toggleBtn);
    } else {
      const spacer = document.createElement('span');
      spacer.style.width = '18px';
      spacer.style.display = 'inline-block';
      leftCol.appendChild(spacer);
    }
    
    const catName = document.createElement('span');
    catName.className = 'fw-bold';
    catName.textContent = cat.name;
    leftCol.appendChild(catName);
    
    const midCol = document.createElement('div');
    midCol.style.width = '200px';
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group input-group-sm';
    const prefix = document.createElement('span');
    prefix.className = 'input-group-text bg-light';
    prefix.textContent = 'Rp';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control text-end fw-medium';
    input.value = window.formatRupiah(cat.budget).replace('Rp ', '');
    input.addEventListener('input', (e) => {
      window.formatInputRupiah(e.target);
      debounceUpdateCategoryBudget(cat.id, input);
    });
    
    inputGroup.appendChild(prefix);
    inputGroup.appendChild(input);
    midCol.appendChild(inputGroup);
    
    const rightCol = document.createElement('div');
    rightCol.className = 'd-flex gap-1 ms-auto';
    
    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn btn-sm btn-outline-secondary';
    btnEdit.innerHTML = '<i class="bi bi-pencil"></i>';
    btnEdit.addEventListener('click', () => openEditCategoryModal(cat.id));
    
    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn btn-sm btn-outline-danger';
    btnDelete.innerHTML = '<i class="bi bi-trash"></i>';
    btnDelete.addEventListener('click', () => confirmDeleteRequest(cat.id, cat.name));
    
    rightCol.appendChild(btnEdit);
    rightCol.appendChild(btnDelete);
    
    catHeader.appendChild(leftCol);
    catHeader.appendChild(midCol);
    catHeader.appendChild(rightCol);
    
    row.appendChild(catHeader);
    
    // Subcategories
    if (hasSubcats) {
      const collapseDiv = document.createElement('div');
      collapseDiv.className = 'collapse mt-3 ps-4 border-top pt-3';
      collapseDiv.id = `subcat-collapse-${cat.id}`;
      
      cat.subcategories.forEach(sub => {
        const subRow = document.createElement('div');
        subRow.className = 'subcategory-row d-flex align-items-center justify-content-between mb-2 gap-3 text-muted';
        
        const subName = document.createElement('span');
        subName.className = 'small flex-grow-1';
        subName.innerHTML = `<i class="bi bi-arrow-return-right me-2"></i>${sub.name}`;
        
        const subMid = document.createElement('div');
        subMid.style.width = '150px';
        const subVal = document.createElement('span');
        subVal.className = 'small fw-medium';
        subVal.textContent = window.formatRupiah(sub.budget);
        subMid.appendChild(subVal);
        
        const subRight = document.createElement('div');
        subRight.style.width = '70px'; // spacer for alignment with main cat buttons
        
        subRow.appendChild(subName);
        subRow.appendChild(subMid);
        subRow.appendChild(subRight);
        
        collapseDiv.appendChild(subRow);
      });
      row.appendChild(collapseDiv);
    }
    
    categoriesContainer.appendChild(row);
  });
}

function updateAllocationSummary() {
  const budgetData = window.getBudget();
  const totalBudget = budgetData.totalBudget;
  const allocated = budgetData.categories.reduce((sum, cat) => sum + cat.budget, 0);
  
  allocatedText.textContent = `${window.formatRupiah(allocated)} / ${window.formatRupiah(totalBudget)}`;
  
  let percentage = 0;
  if (totalBudget > 0) {
    percentage = (allocated / totalBudget) * 100;
  } else if (allocated > 0) {
    percentage = 100;
  }
  
  allocationProgress.style.width = `${Math.min(percentage, 100)}%`;
  
  allocationProgress.className = 'progress-bar';
  allocationBadge.className = 'badge';
  
  if (allocated > totalBudget && totalBudget > 0) {
    allocationProgress.classList.add('bg-danger');
    allocationBadge.classList.add('bg-danger');
    allocationBadge.textContent = 'Over Budget';
  } else if (allocated > totalBudget && totalBudget === 0) {
    allocationProgress.classList.add('bg-danger');
    allocationBadge.classList.add('bg-danger');
    allocationBadge.textContent = 'Over Budget';
  } else if (percentage === 100) {
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
function openAddCategoryModal() {
  document.getElementById('category-modal-title').textContent = 'Tambah Kategori';
  document.getElementById('cat-id-input').value = '';
  document.getElementById('cat-name-input').value = '';
  document.getElementById('cat-budget-input').value = '';
  document.getElementById('subcat-list-container').innerHTML = '';
  
  document.getElementById('cat-name-input').classList.remove('is-invalid');
  document.getElementById('cat-budget-input').classList.remove('is-invalid');
  
  categoryModal.showModal();
}

function openEditCategoryModal(catId) {
  const cat = window.getCategoryById(catId);
  if (!cat) return;
  
  document.getElementById('category-modal-title').textContent = 'Edit Kategori';
  document.getElementById('cat-id-input').value = cat.id;
  document.getElementById('cat-name-input').value = cat.name;
  document.getElementById('cat-budget-input').value = window.formatRupiah(cat.budget).replace('Rp ', '');
  
  const subcatContainer = document.getElementById('subcat-list-container');
  subcatContainer.innerHTML = '';
  
  if (cat.subcategories) {
    cat.subcategories.forEach(sub => {
      addSubcatInputRow(sub.name, sub.budget);
    });
  }
  
  document.getElementById('cat-name-input').classList.remove('is-invalid');
  document.getElementById('cat-budget-input').classList.remove('is-invalid');
  
  categoryModal.showModal();
}

function closeCategoryModal() {
  categoryModal.close();
}

function addSubcatInputRow(name = '', budget = 0) {
  const container = document.getElementById('subcat-list-container');
  const row = document.createElement('div');
  row.className = 'd-flex gap-2 mb-2 subcat-input-row';
  
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
  budgetInput.addEventListener('input', (e) => window.formatInputRupiah(e.target));
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-outline-danger';
  removeBtn.innerHTML = '<i class="bi bi-x"></i>';
  removeBtn.addEventListener('click', () => row.remove());
  
  row.appendChild(nameInput);
  row.appendChild(budgetInput);
  row.appendChild(removeBtn);
  
  container.appendChild(row);
}

async function saveCategoryFromModal() {
  const nameInput = document.getElementById('cat-name-input');
  const budgetInput = document.getElementById('cat-budget-input');
  
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
        id: window.generateId('sub'),
        name: sName,
        budget: sBudg
      });
    }
  });
  
  if (!isValid) return;
  
  const catId = document.getElementById('cat-id-input').value;
  if (catId) {
    await window.updateCategory(catId, {
      name: nameInput.value.trim(),
      budget: budgetVal,
      subcategories: subcategories
    });
  } else {
    await window.addCategory(nameInput.value.trim(), budgetVal, subcategories);
  }
  
  closeCategoryModal();
  renderCategories();
  updateAllocationSummary();
}

function confirmDeleteRequest(catId, catName) {
  currentDeleteId = catId;
  document.getElementById('delete-confirm-text').textContent = `Apakah Anda yakin ingin menghapus kategori "${catName}"?`;
  deleteConfirmModal.showModal();
}

async function confirmDeleteCategory() {
  if (currentDeleteId) {
    await window.deleteCategory(currentDeleteId);
    renderCategories();
    updateAllocationSummary();
  }
  deleteConfirmModal.close();
  currentDeleteId = null;
}
