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

// Tom Select instances
let tomSelectType = null;
let tomSelectCategory = null;
let tomSelectFormCategory = null;
let tomSelectFormSubcategory = null;
let tomSelectEditCategory = null;
let tomSelectEditSubcategory = null;

function initTomSelectFilters() {
  if (typeof TomSelect === 'undefined') return;

  const typeEl = document.getElementById('filter-type');
  if (typeEl && !typeEl.tomselect) {
    tomSelectType = new TomSelect(typeEl, {
      create: false,
      controlInput: null,
      allowEmptyOption: true,
      placeholder: 'Semua Tipe',
      onChange: () => applyFilters()
    });
  }

  const catEl = document.getElementById('filter-category');
  if (catEl && !catEl.tomselect) {
    tomSelectCategory = new TomSelect(catEl, {
      create: false,
      controlInput: null,
      allowEmptyOption: true,
      placeholder: 'Semua Kategori',
      onChange: () => applyFilters()
    });
  }

  const formCatEl = document.getElementById('txn-category');
  if (formCatEl && !formCatEl.tomselect) {
    tomSelectFormCategory = new TomSelect(formCatEl, {
      create: false,
      controlInput: null,
      allowEmptyOption: true,
      placeholder: 'Pilih Kategori',
      onChange: () => handleCategoryChange()
    });
  }

  const formSubcatEl = document.getElementById('txn-subcategory');
  if (formSubcatEl && !formSubcatEl.tomselect) {
    tomSelectFormSubcategory = new TomSelect(formSubcatEl, {
      create: false,
      controlInput: null,
      allowEmptyOption: true,
      placeholder: 'Pilih Sub-Kategori (Opsional)'
    });
  }

  const editCatEl = document.getElementById('edit-txn-category');
  if (editCatEl && !editCatEl.tomselect) {
    tomSelectEditCategory = new TomSelect(editCatEl, {
      create: false,
      controlInput: null,
      allowEmptyOption: true,
      placeholder: 'Pilih Kategori',
      onChange: () => handleEditCategoryChange()
    });
  }

  const editSubcatEl = document.getElementById('edit-txn-subcategory');
  if (editSubcatEl && !editSubcatEl.tomselect) {
    tomSelectEditSubcategory = new TomSelect(editSubcatEl, {
      create: false,
      controlInput: null,
      allowEmptyOption: true,
      placeholder: 'Pilih Sub-Kategori (Opsional)'
    });
  }
}

function initTracker() {
  formCategory = document.getElementById('txn-category');
  formSubcategory = document.getElementById('txn-subcategory');
  filterCategory = document.getElementById('filter-category');
  editCategory = document.getElementById('edit-txn-category');
  editSubcategory = document.getElementById('edit-txn-subcategory');

  document.getElementById('txn-date').value = getToday();
  initTomSelectFilters();
  populateCategorySelects();
  loadTransactions();

  const addModalEl = document.getElementById('addTransactionModal');
  if (addModalEl) {
    addModalEl.addEventListener('hidden.bs.modal', () => {
      resetForm();
    });
  }
}

function populateCategorySelects() {
  const categories = getCategories();
  
  // Clear existing
  if (formCategory) formCategory.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
  if (filterCategory) filterCategory.innerHTML = '<option value="">Semua Kategori</option>';
  if (editCategory) editCategory.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';

  categories.forEach(cat => {
    const isSavings = !!(cat.isSavings || cat.is_savings);
    const suffix = isSavings ? ' 💰 (Tabungan)' : '';
    if (formCategory) formCategory.innerHTML += `<option value="${cat.id}">${cat.name}${suffix}</option>`;
    if (filterCategory) filterCategory.innerHTML += `<option value="${cat.id}">${cat.name}${suffix}</option>`;
    if (editCategory) editCategory.innerHTML += `<option value="${cat.id}">${cat.name}${suffix}</option>`;
  });

  // Sync dengan Tom Select Category jika sudah terinisialisasi
  if (tomSelectCategory) {
    const currentVal = tomSelectCategory.getValue();
    tomSelectCategory.clearOptions();
    tomSelectCategory.addOption({ value: '', text: 'Semua Kategori' });
    categories.forEach(cat => {
      const isSavings = !!(cat.isSavings || cat.is_savings);
      const suffix = isSavings ? ' 💰 (Tabungan)' : '';
      tomSelectCategory.addOption({ value: cat.id, text: `${cat.name}${suffix}` });
    });
    tomSelectCategory.setValue(currentVal || '', true);
  }

  // Sync dengan Tom Select Form Category
  if (tomSelectFormCategory) {
    const currentVal = tomSelectFormCategory.getValue();
    tomSelectFormCategory.clearOptions();
    tomSelectFormCategory.addOption({ value: '', text: 'Pilih Kategori' });
    categories.forEach(cat => {
      const isSavings = !!(cat.isSavings || cat.is_savings);
      const suffix = isSavings ? ' 💰 (Tabungan)' : '';
      tomSelectFormCategory.addOption({ value: cat.id, text: `${cat.name}${suffix}` });
    });
    tomSelectFormCategory.setValue(currentVal || '', true);
  }

  // Sync dengan Tom Select Edit Category
  if (tomSelectEditCategory) {
    const currentVal = tomSelectEditCategory.getValue();
    tomSelectEditCategory.clearOptions();
    tomSelectEditCategory.addOption({ value: '', text: 'Pilih Kategori' });
    categories.forEach(cat => {
      const isSavings = !!(cat.isSavings || cat.is_savings);
      const suffix = isSavings ? ' 💰 (Tabungan)' : '';
      tomSelectEditCategory.addOption({ value: cat.id, text: `${cat.name}${suffix}` });
    });
    tomSelectEditCategory.setValue(currentVal || '', true);
  }
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
    if (tomSelectFormCategory) tomSelectFormCategory.setValue('', true);
    if (tomSelectFormSubcategory) tomSelectFormSubcategory.setValue('', true);
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
    if (tomSelectEditCategory) tomSelectEditCategory.setValue('', true);
    if (tomSelectEditSubcategory) tomSelectEditSubcategory.setValue('', true);
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
  const catId = tomSelectFormCategory ? tomSelectFormCategory.getValue() : (formCategory ? formCategory.value : '');
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
  const catId = tomSelectEditCategory ? tomSelectEditCategory.getValue() : (editCategory ? editCategory.value : '');
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
  if (subcategorySelectElement) {
    subcategorySelectElement.innerHTML = '<option value="">Tidak ada sub-kategori</option>';
  }
  
  const category = categoryId ? getCategoryById(categoryId) : null;
  const hasSubcats = category && category.subcategories && category.subcategories.length > 0;
  
  if (subcategorySelectElement && hasSubcats) {
    subcategorySelectElement.innerHTML = '<option value="">Pilih Sub-Kategori (Opsional)</option>';
    category.subcategories.forEach(sub => {
      subcategorySelectElement.innerHTML += `<option value="${sub.id}">${sub.name}</option>`;
    });
  }

  // Sync Tom Select untuk subcategory form atau edit
  let targetTomSelect = null;
  if (subcategorySelectElement === formSubcategory && tomSelectFormSubcategory) {
    targetTomSelect = tomSelectFormSubcategory;
  } else if (subcategorySelectElement === editSubcategory && tomSelectEditSubcategory) {
    targetTomSelect = tomSelectEditSubcategory;
  }

  if (targetTomSelect) {
    targetTomSelect.clearOptions();
    if (hasSubcats) {
      targetTomSelect.addOption({ value: '', text: 'Pilih Sub-Kategori (Opsional)' });
      category.subcategories.forEach(sub => {
        targetTomSelect.addOption({ value: sub.id, text: sub.name });
      });
      targetTomSelect.setValue('', true);
    } else {
      targetTomSelect.addOption({ value: '', text: 'Tidak ada sub-kategori' });
      targetTomSelect.setValue('', true);
    }
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

  if (tomSelectFormCategory) {
    tomSelectFormCategory.setValue('', true);
  }
  if (tomSelectFormSubcategory) {
    tomSelectFormSubcategory.clearOptions();
    tomSelectFormSubcategory.addOption({ value: '', text: 'Tidak ada sub-kategori' });
    tomSelectFormSubcategory.setValue('', true);
  } else if (formSubcategory) {
    formSubcategory.innerHTML = '<option value="">Tidak ada sub-kategori</option>';
  }

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
  const categoryId = isIncome ? null : (tomSelectFormCategory ? tomSelectFormCategory.getValue() : (formCategory ? formCategory.value : null));
  const subcategoryId = isIncome ? null : ((tomSelectFormSubcategory ? tomSelectFormSubcategory.getValue() : (formSubcategory ? formSubcategory.value : null)) || null);
  const description = document.getElementById('txn-desc').value;
  const amount = parseRupiah(document.getElementById('txn-amount').value);
  
  if (amount <= 0) {
    alert('Nominal harus lebih dari 0');
    return;
  }

  if (type === 'expense') {
    if (!categoryId) {
      alert('Harap pilih kategori pengeluaran.');
      if (tomSelectFormCategory) tomSelectFormCategory.focus();
      else if (formCategory) formCategory.focus();
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

    // Hitung sisa saldo kategori / sub-kategori saat ini
    const spentMap = getSpentByCategory();
    const spentBySub = typeof getSpentBySubcategory === 'function' ? getSpentBySubcategory() : {};
    
    let targetRemaining = 0;
    let targetSubObj = null;

    if (subcategoryId && Array.isArray(cat.subcategories)) {
      targetSubObj = cat.subcategories.find(s => s.id == subcategoryId);
      if (targetSubObj) {
        const subSpent = spentBySub[subcategoryId] || 0;
        targetRemaining = (targetSubObj.budget || 0) - subSpent;
      }
    } else {
      const currentSpent = spentMap[categoryId] || 0;
      const catBudget = cat ? (cat.budget || 0) : 0;
      targetRemaining = catBudget - currentSpent;
    }

    const deficit = amount - targetRemaining;

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
        targetSubId: subcategoryId || null,
        targetSubName: targetSubObj ? targetSubObj.name : null,
        targetRemaining: targetRemaining,
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
    
    // Hide modal using Bootstrap API
    const addModalEl = document.getElementById('addTransactionModal');
    if (addModalEl) {
      const bsModal = bootstrap.Modal.getInstance(addModalEl);
      if (bsModal) bsModal.hide();
    }
    resetForm();
    
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
// Overbudget Modal & Realokasi Saldo (Kategori & Sub-Kategori)
// -------------------------------------------------------------
let pendingOverbudget = null;

function openOverbudgetModal(data) {
  pendingOverbudget = data;

  // Tutup modal form transaksi jika sedang terbuka
  const addModalEl = document.getElementById('addTransactionModal');
  if (addModalEl) {
    const bsModal = bootstrap.Modal.getInstance(addModalEl);
    if (bsModal) bsModal.hide();
  }

  const targetNameEl = document.getElementById('overbudget-target-cat-name');
  const deficitEl = document.getElementById('overbudget-deficit-amount');
  const sourceSelect = document.getElementById('overbudget-source-cat');
  const confirmBtn = document.getElementById('btn-confirm-reallocate');
  const helpText = document.getElementById('overbudget-source-help');
  const previewBox = document.getElementById('overbudget-preview-box');

  const fullTargetName = data.targetSubName
    ? `${data.targetCat.name} › ${data.targetSubName}`
    : (data.targetCat ? data.targetCat.name : 'Kategori');

  if (targetNameEl) targetNameEl.textContent = fullTargetName;
  if (deficitEl) deficitEl.textContent = formatRupiah(data.deficit);

  // Ambil data kategori & pengeluaran terkini
  const categories = getCategories();
  const spentMap = getSpentByCategory();
  const spentBySub = typeof getSpentBySubcategory === 'function' ? getSpentBySubcategory() : {};

  sourceSelect.innerHTML = '';
  let optionCount = 0;

  categories.forEach(cat => {
    // 1. Jika Kategori Utama memiliki sub-kategori: render sebagai <optgroup>
    if (Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
      const eligibleSubs = cat.subcategories.filter(sub => {
        // Jangan tawarkan sub-kategori target yang sama
        if (data.targetSubId && sub.id == data.targetSubId) return false;
        const subSpent = spentBySub[sub.id] || 0;
        const rem = (sub.budget || 0) - subSpent;
        return rem > 0;
      });

      if (eligibleSubs.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = cat.name;

        eligibleSubs.forEach(sub => {
          const subSpent = spentBySub[sub.id] || 0;
          const rem = (sub.budget || 0) - subSpent;
          const option = document.createElement('option');
          option.value = `${cat.id}|${sub.id}`;
          option.textContent = `${sub.name} (Sisa: ${formatRupiah(rem)})`;
          optgroup.appendChild(option);
          optionCount++;
        });

        sourceSelect.appendChild(optgroup);
      }
    } else {
      // 2. Jika Kategori Utama TIDAK memiliki sub-kategori: render sebagai <option> langsung
      if (!data.targetSubId && cat.id == data.targetCat.id) return;
      const catSpent = spentMap[cat.id] || 0;
      const rem = (cat.budget || 0) - catSpent;
      if (rem > 0) {
        const option = document.createElement('option');
        option.value = `${cat.id}`;
        option.textContent = `${cat.name} (Sisa: ${formatRupiah(rem)})`;
        sourceSelect.appendChild(option);
        optionCount++;
      }
    }
  });

  if (optionCount === 0) {
    sourceSelect.innerHTML = '<option value="" disabled selected>Tidak ada kategori / sub-kategori lain dengan sisa saldo positif</option>';
    if (confirmBtn) confirmBtn.disabled = true;
    if (helpText) helpText.textContent = 'Semua pos pengeluaran lain telah habis atau tidak memiliki sisa saldo.';
    if (previewBox) previewBox.classList.add('d-none');
  } else {
    if (confirmBtn) confirmBtn.disabled = false;
    if (helpText) helpText.textContent = 'Pilih sub-kategori atau kategori yang masih memiliki sisa saldo positif.';
    if (previewBox) previewBox.classList.remove('d-none');
    handleOverbudgetSourceChange();
  }

  const modal = document.getElementById('overbudget-modal');
  if (modal) modal.showModal();
}

function handleOverbudgetSourceChange() {
  if (!pendingOverbudget) return;

  const sourceSelect = document.getElementById('overbudget-source-cat');
  const sourceVal = sourceSelect.value;
  if (!sourceVal) return;

  const [sourceCatId, sourceSubId] = sourceVal.split('|');
  const sourceCat = getCategoryById(sourceCatId);
  if (!sourceCat) return;

  const spentMap = getSpentByCategory();
  const spentBySub = typeof getSpentBySubcategory === 'function' ? getSpentBySubcategory() : {};
  const deficit = pendingOverbudget.deficit;

  const previewSourceName = document.getElementById('preview-source-name');
  const previewSourceCalc = document.getElementById('preview-source-calc');
  const previewTargetName = document.getElementById('preview-target-name');
  const previewTargetCalc = document.getElementById('preview-target-calc');

  if (sourceSubId && Array.isArray(sourceCat.subcategories)) {
    const sourceSub = sourceCat.subcategories.find(s => s.id == sourceSubId);
    if (sourceSub) {
      const subSpent = spentBySub[sourceSub.id] || 0;
      const subBudget = sourceSub.budget || 0;
      const newSubBudget = Math.max(0, subBudget - deficit);
      const newSubRem = Math.max(0, subBudget - subSpent - deficit);

      if (previewSourceName) previewSourceName.textContent = `${sourceCat.name} › ${sourceSub.name}:`;
      if (previewSourceCalc) {
        previewSourceCalc.textContent = `${formatRupiah(subBudget)} → ${formatRupiah(newSubBudget)} (Sisa: ${formatRupiah(newSubRem)})`;
      }
    }
  } else {
    const catSpent = spentMap[sourceCat.id] || 0;
    const catBudget = sourceCat.budget || 0;
    const newCatBudget = Math.max(0, catBudget - deficit);
    const newCatRem = Math.max(0, catBudget - catSpent - deficit);

    if (previewSourceName) previewSourceName.textContent = `${sourceCat.name}:`;
    if (previewSourceCalc) {
      previewSourceCalc.textContent = `${formatRupiah(catBudget)} → ${formatRupiah(newCatBudget)} (Sisa: ${formatRupiah(newCatRem)})`;
    }
  }

  const targetCat = pendingOverbudget.targetCat;
  if (pendingOverbudget.targetSubId && Array.isArray(targetCat.subcategories)) {
    const targetSub = targetCat.subcategories.find(s => s.id == pendingOverbudget.targetSubId);
    if (targetSub) {
      const targetSubBudget = targetSub.budget || 0;
      const newTargetSubBudget = targetSubBudget + deficit;
      if (previewTargetName) previewTargetName.textContent = `${targetCat.name} › ${targetSub.name}:`;
      if (previewTargetCalc) {
        previewTargetCalc.textContent = `${formatRupiah(targetSubBudget)} → ${formatRupiah(newTargetSubBudget)}`;
      }
    }
  } else {
    const targetBudget = targetCat ? (targetCat.budget || 0) : 0;
    const newTargetBudget = targetBudget + deficit;
    if (previewTargetName) previewTargetName.textContent = `${targetCat.name}:`;
    if (previewTargetCalc) {
      previewTargetCalc.textContent = `${formatRupiah(targetBudget)} → ${formatRupiah(newTargetBudget)}`;
    }
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
  const sourceVal = sourceSelect.value;
  if (!sourceVal) {
    alert('Harap pilih kategori sumber saldo.');
    return;
  }

  const [sourceCatId, sourceSubId] = sourceVal.split('|');
  const sourceCat = getCategoryById(sourceCatId);
  const targetCat = pendingOverbudget.targetCat;

  let sourceFullName = sourceCat ? sourceCat.name : 'Kategori';
  if (sourceSubId && sourceCat && Array.isArray(sourceCat.subcategories)) {
    const sourceSub = sourceCat.subcategories.find(s => s.id == sourceSubId);
    if (sourceSub) sourceFullName = `${sourceCat.name} › ${sourceSub.name}`;
  }

  let targetFullName = targetCat ? targetCat.name : 'Kategori';
  if (pendingOverbudget.targetSubId && targetCat && Array.isArray(targetCat.subcategories)) {
    const targetSub = targetCat.subcategories.find(s => s.id == pendingOverbudget.targetSubId);
    if (targetSub) targetFullName = `${targetCat.name} › ${targetSub.name}`;
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
      pendingOverbudget.deficit,
      sourceSubId || null,
      pendingOverbudget.targetSubId || null
    );

    if (success) {
      // 1. Injeksi Transaksi Sistem (Audit Trail)
      const auditTxn = {
        type: 'reallocation',
        is_system: true,
        date: pendingOverbudget.txnData.date || (new Date().toISOString().split('T')[0]),
        categoryId: sourceCatId,
        subcategoryId: sourceSubId || null,
        description: `Realokasi otomatis dari ${sourceFullName} ke ${targetFullName}`,
        amount: pendingOverbudget.deficit,
      };
      await addTransaction(auditTxn);

      // 2. Simpan transaksi pengeluaran asli setelah budget berhasil dialihkan
      await addTransaction(pendingOverbudget.txnData, pendingOverbudget.file);

      closeOverbudgetDialog();
      
      const addModalEl = document.getElementById('addTransactionModal');
      if (addModalEl) {
        const bsModal = bootstrap.Modal.getInstance(addModalEl);
        if (bsModal) bsModal.hide();
      }
      resetForm();

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
  const typeFilter = tomSelectType ? tomSelectType.getValue() : (document.getElementById('filter-type') ? document.getElementById('filter-type').value : '');
  const catFilter = tomSelectCategory ? tomSelectCategory.getValue() : (filterCategory ? filterCategory.value : '');
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
  if (tomSelectType) {
    tomSelectType.setValue('', true);
  } else {
    const filterTypeEl = document.getElementById('filter-type');
    if (filterTypeEl) filterTypeEl.value = '';
  }

  if (tomSelectCategory) {
    tomSelectCategory.setValue('', true);
  } else if (filterCategory) {
    filterCategory.value = '';
  }

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
  
  let pageItems;
  if (window._isPrinting) {
    pageItems = filteredTransactions;
    if (paginationNav) paginationNav.classList.add('d-none');
  } else {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredTransactions.length);
    pageItems = filteredTransactions.slice(startIndex, endIndex);
  }
  
  for (const txn of pageItems) {
    const isIncome = txn.type === 'income';
    const isReallocation = txn.type === 'reallocation';
    const isSystem = txn.is_system || txn.isSystem || isReallocation;
    let categoryHtml = '';
    let amountHtml = '';
    let actionHtml = '';

    if (isIncome) {
      categoryHtml = `
        <span class="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill fw-semibold px-2 py-1">
          <i class="bi bi-arrow-down-left me-1"></i>Pemasukan
        </span>
      `;
      amountHtml = `<span class="text-success fw-bold font-monospace">+${formatRupiah(txn.amount)}</span>`;
    } else if (isReallocation) {
      categoryHtml = `
        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle rounded-pill fw-semibold px-2 py-1">
          <i class="bi bi-arrow-left-right me-1"></i>Realokasi
        </span>
      `;
      amountHtml = `<span class="text-secondary fw-semibold font-monospace">↔ ${formatRupiah(txn.amount)}</span>`;
    } else {
      const category = getCategoryById(txn.categoryId);
      const catName = category ? category.name : 'Umum';
      const isSavings = category && (category.isSavings || category.is_savings);
      
      let subName = '';
      if (txn.subcategoryId && category && Array.isArray(category.subcategories)) {
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

    if (isSystem) {
      actionHtml = `
        <span class="badge bg-light text-muted border px-2 py-1 small" title="Transaksi sistem dibuat otomatis (tidak dapat diubah)">
          <i class="bi bi-lock-fill me-1"></i>Sistem
        </span>
      `;
    } else {
      actionHtml = `
        <div class="btn-group">
          <button class="btn btn-sm btn-light" onclick="openEditDialog('${txn.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-light text-danger" onclick="confirmDelete('${txn.id}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </div>
      `;
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
        ${actionHtml}
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
  if (txn.is_system || txn.isSystem || txn.type === 'reallocation') {
    alert('Transaksi sistem tidak dapat diubah.');
    return;
  }
  
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
    if (tomSelectEditCategory) {
      tomSelectEditCategory.setValue(txn.categoryId, true);
    } else {
      editCategory.value = txn.categoryId;
    }
    handleEditCategoryChange();
    
    if (txn.subcategoryId) {
      if (tomSelectEditSubcategory) {
        tomSelectEditSubcategory.setValue(txn.subcategoryId, true);
      } else {
        editSubcategory.value = txn.subcategoryId;
      }
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
  const categoryId = isIncome ? null : (tomSelectEditCategory ? tomSelectEditCategory.getValue() : (editCategory ? editCategory.value : null));
  const subcategoryId = isIncome ? null : ((tomSelectEditSubcategory ? tomSelectEditSubcategory.getValue() : (editSubcategory ? editSubcategory.value : null)) || null);
  const description = document.getElementById('edit-txn-desc').value;
  const amount = parseRupiah(document.getElementById('edit-txn-amount').value);
  
  if (amount <= 0) {
    alert('Nominal harus lebih dari 0');
    return;
  }

  if (type === 'expense') {
    if (!categoryId) {
      alert('Harap pilih kategori pengeluaran.');
      if (tomSelectEditCategory) tomSelectEditCategory.focus();
      else if (editCategory) editCategory.focus();
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
  const txn = currentTransactions.find(t => t.id == txnId);
  if (txn && (txn.is_system || txn.isSystem || txn.type === 'reallocation')) {
    alert('Transaksi sistem tidak dapat dihapus.');
    return;
  }
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

// -------------------------------------------------------------
// Ekspor Data ke Excel/CSV & PDF
// -------------------------------------------------------------

function exportToCSV() {
  const transactions = filteredTransactions || [];
  if (transactions.length === 0) {
    alert('Tidak ada data transaksi untuk diekspor.');
    return;
  }

  const categories = getCategories();
  const rows = [];
  // Header CSV
  rows.push(['Tanggal', 'Tipe', 'Kategori', 'Sub-Kategori', 'Keterangan', 'Nominal (Rp)']);

  transactions.forEach(txn => {
    const isIncome = txn.type === 'income';
    const isReallocation = txn.type === 'reallocation';
    let typeLabel = 'Pengeluaran';
    let catName = '-';
    let subName = '-';

    if (isIncome) {
      typeLabel = 'Pemasukan';
    } else if (isReallocation) {
      typeLabel = 'Realokasi';
    } else {
      const cat = categories.find(c => c.id == txn.categoryId);
      if (cat) {
        catName = cat.name;
        if (txn.subcategoryId && Array.isArray(cat.subcategories)) {
          const sub = cat.subcategories.find(s => s.id == txn.subcategoryId);
          if (sub) subName = sub.name;
        }
      }
    }

    const desc = (txn.description || '').replace(/"/g, '""');
    const amountVal = isIncome ? txn.amount : (isReallocation ? txn.amount : -txn.amount);

    rows.push([
      `"${txn.date}"`,
      `"${typeLabel}"`,
      `"${catName}"`,
      `"${subName}"`,
      `"${desc}"`,
      amountVal
    ]);
  });

  const csvString = rows.map(r => r.join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Rekap_Transaksi_BudgetKu.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportToPDF() {
  if (!filteredTransactions || filteredTransactions.length === 0) {
    alert('Tidak ada data transaksi untuk diekspor.');
    return;
  }

  const printDateEl = document.getElementById('print-date');
  if (printDateEl) {
    const now = new Date();
    printDateEl.textContent = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  window.print();
}

window.addEventListener('beforeprint', () => {
  window._isPrinting = true;
  renderTable();
});

window.addEventListener('afterprint', () => {
  window._isPrinting = false;
  renderTable();
});

