/* ============================================================
   BudgetKu — Setup Budget Module (budget.js)
   Refactored for Supabase Cloud Database Direct Synchronization.
   LocalStorage for budget and categories removed.
   ============================================================ */

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

/**
 * Inisialisasi Supabase JS Client
 * @returns {object|null}
 */
function getSupabaseClient() {
  if (window.supabaseClient) {
    return window.supabaseClient;
  }
  const urlMeta = document.querySelector('meta[name="supabase-url"]');
  const keyMeta = document.querySelector('meta[name="supabase-key"]');
  const supabaseUrl = (urlMeta ? urlMeta.getAttribute('content') : '') || window.SUPABASE_URL || 'https://dmhifcfsloncgjrxzvnl.supabase.co';
  const supabaseKey = (keyMeta ? keyMeta.getAttribute('content') : '') || window.SUPABASE_ANON_KEY || 'sb_publishable_0UVfI5vLmCrS4Oilr0rDMg_5YQtQsQl';

  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    try {
      window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
      return window.supabaseClient;
    } catch (e) {
      console.warn('[Supabase] Gagal membuat client:', e);
    }
  }
  return null;
}

/**
 * Dapatkan user yang sedang aktif dari session Supabase Auth
 * @returns {Promise<object|null>}
 */
async function getActiveSupabaseUser() {
  const client = getSupabaseClient();
  if (client && client.auth && typeof client.auth.getUser === 'function') {
    try {
      const { data: { user }, error } = await client.auth.getUser();
      if (user && user.id) {
        return user;
      }
    } catch (err) {
      console.warn('Gagal membaca user dari client.auth.getUser():', err);
    }
  }

  // Fallback: Ambil data user dari session helper aplikasi
  if (typeof window.getActiveUser === 'function') {
    const active = window.getActiveUser();
    if (active && active.id) return active;
  }

  const rawUser = localStorage.getItem('budgetku_user') || sessionStorage.getItem('budgetku_user');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      if (parsed && parsed.id) return parsed;
    } catch (e) {}
  }

  return null;
}

/**
 * Inisialisasi Halaman Budget
 */
window.initBudget = async function() {
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
  renderCategories();
  updateAllocationSummary();

  // Muat data total budget langsung dari Supabase saat halaman dimuat
  await loadBudgetDataFromSupabase();
};

/**
 * Setup Event Listener interaksi form & modal
 */
function setupEventListeners() {
  if (totalBudgetInput) {
    totalBudgetInput.addEventListener('input', (e) => {
      if (window.formatInputRupiah) {
        window.formatInputRupiah(e.target);
      }
    });

    totalBudgetInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSetBudget();
      }
    });
  }

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
  const btnCancelCat = document.getElementById('btn-cancel-cat-modal');
  if (btnCancelCat) btnCancelCat.addEventListener('click', closeCategoryModal);

  const btnSaveCat = document.getElementById('btn-save-cat-modal');
  if (btnSaveCat) btnSaveCat.addEventListener('click', saveCategoryFromModal);

  const btnAddSubcat = document.getElementById('btn-add-subcat');
  if (btnAddSubcat) btnAddSubcat.addEventListener('click', () => addSubcatInputRow());

  const catBudgetInput = document.getElementById('cat-budget-input');
  if (catBudgetInput) {
    catBudgetInput.addEventListener('input', (e) => {
      if (window.formatInputRupiah) {
        window.formatInputRupiah(e.target);
      }
    });
  }

  // Delete modal listeners
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  if (btnCancelDelete) {
    btnCancelDelete.addEventListener('click', () => {
      if (deleteConfirmModal) deleteConfirmModal.close();
      currentDeleteId = null;
    });
  }

  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', confirmDeleteCategory);
  }
}

/**
 * 2. Integrasi Read Data (Supabase):
 * Ambil session user aktif, query SELECT ke tabel 'budgets' berdasarkan user_id dan month,
 * lalu tampilkan total_budget ke dalam input form.
 */
async function loadBudgetDataFromSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[Supabase] Client tidak tersedia untuk membaca data.');
    renderTotalBudgetFromMemory();
    return;
  }

  try {
    const user = await getActiveSupabaseUser();
    if (!user || !user.id) {
      console.warn('[Supabase] Sesi pengguna aktif tidak ditemukan.');
      renderTotalBudgetFromMemory();
      return;
    }

    const currentMonth = typeof window.getCurrentMonth === 'function'
      ? window.getCurrentMonth()
      : (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'));

    // Query SELECT ke tabel budgets berdasarkan user_id dan month
    const { data, error } = await client
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .maybeSingle();

    if (error) {
      console.error('[Supabase] Gagal membaca data budget:', error);
      if (typeof window.showAppModal === 'function') {
        window.showAppModal({
          title: 'Gagal Memuat Data',
          message: `Terjadi kendala saat membaca data budget: ${error.message}`,
          type: 'danger'
        });
      }
      return;
    }

    if (data && data.total_budget != null) {
      const amount = Number(data.total_budget);
      if (totalBudgetInput) {
        totalBudgetInput.value = window.formatRupiah ? window.formatRupiah(amount).replace('Rp ', '') : String(amount);
      }
      if (typeof window.getBudget === 'function') {
        const inMemory = window.getBudget();
        inMemory.totalBudget = amount;
        inMemory.month = currentMonth;
        inMemory.user_id = user.id;
      }
    } else {
      if (totalBudgetInput) totalBudgetInput.value = '';
    }

    updateAllocationSummary();
  } catch (err) {
    console.error('[Supabase] Error saat menjalankan query select budget:', err);
  }
}

/**
 * Fallback render dari memory jika Supabase query belum selesai
 */
function renderTotalBudgetFromMemory() {
  if (typeof window.getBudget === 'function') {
    const budget = window.getBudget();
    if (budget && budget.totalBudget > 0 && totalBudgetInput) {
      totalBudgetInput.value = window.formatRupiah(budget.totalBudget).replace('Rp ', '');
    } else if (totalBudgetInput) {
      totalBudgetInput.value = '';
    }
  }
}

/**
 * 3. Integrasi Write/Save Data (Supabase) & 4. Error Handling:
 * Saat tombol "Set" ditekan, jalankan fungsi upsert ke tabel 'budgets'
 * Payload: { user_id, month, total_budget }
 * Berikan alert sukses atau alert error dengan pesan asli dari Supabase.
 */
async function handleSetBudget() {
  const btn = document.getElementById('btn-set-budget');
  const amountStr = totalBudgetInput ? totalBudgetInput.value : '';
  const totalBudget = window.parseRupiah 
    ? window.parseRupiah(amountStr) 
    : parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;

  const client = getSupabaseClient();
  if (!client) {
    const errorMsg = 'Koneksi ke server belum terpasang atau tidak tersedia. Pastikan perangkat Anda terhubung ke internet.';
    if (typeof window.showAppModal === 'function') {
      window.showAppModal({
        title: 'Koneksi Tidak Tersedia',
        message: errorMsg,
        type: 'danger'
      });
    } else {
      alert(errorMsg);
    }
    return;
  }

  // Tampilkan indikator loading pada tombol
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
  }

  try {
    const user = await getActiveSupabaseUser();
    if (!user || !user.id) {
      throw new Error('Sesi pengguna tidak valid. Silakan masuk kembali ke akun Anda.');
    }

    const currentMonth = typeof window.getCurrentMonth === 'function'
      ? window.getCurrentMonth()
      : (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'));

    // Siapkan payload sesuai spesifikasi
    const payload = {
      user_id: user.id,
      month: currentMonth,
      total_budget: totalBudget
    };

    // Jalankan operasi upsert (Update or Insert) ke tabel budgets
    const { data, error } = await client
      .from('budgets')
      .upsert(payload, { onConflict: 'user_id,month' })
      .select();

    if (error) {
      throw error;
    }

    // Update in-memory cache dan sinkronisasi
    if (typeof window.getBudget === 'function') {
      const b = window.getBudget();
      b.totalBudget = totalBudget;
      b.month = currentMonth;
      b.user_id = user.id;
    }
    if (typeof window.updateTotalBudget === 'function') {
      window.updateTotalBudget(totalBudget);
    }

    updateAllocationSummary();

    // 4. Alert Sukses
    if (typeof window.showAppModal === 'function') {
      window.showAppModal({
        title: 'Berhasil Disimpan',
        message: `Total uang bulanan sebesar <strong>${window.formatRupiah ? window.formatRupiah(totalBudget) : 'Rp ' + totalBudget}</strong> berhasil disimpan.`,
        type: 'success'
      });
    } else {
      alert(`Total uang bulanan sebesar ${window.formatRupiah ? window.formatRupiah(totalBudget) : 'Rp ' + totalBudget} berhasil disimpan.`);
    }

    const feedback = document.getElementById('budget-saved-feedback');
    if (feedback) {
      feedback.classList.remove('d-none');
      setTimeout(() => {
        feedback.classList.add('d-none');
      }, 3500);
    }

    if (btn) {
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Tersimpan!';
      setTimeout(() => {
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Set';
      }, 2000);
    }
  } catch (err) {
    // 4. Error Handling: Tampilkan pesan asli error (misal RLS / network issue)
    console.error('[Supabase] Gagal melakukan upsert budget:', err);
    const errorMessage = err.message || err.error_description || 'Terjadi kendala saat menyimpan data budget.';
    
    if (typeof window.showAppModal === 'function') {
      window.showAppModal({
        title: 'Gagal Menyimpan Data',
        message: `Terjadi kendala saat menyimpan data:<br><br><div class="p-2 bg-danger-subtle text-danger rounded small font-monospace">${errorMessage}</div>`,
        type: 'danger'
      });
    } else {
      alert(`Gagal menyimpan data: ${errorMessage}`);
    }
  } finally {
    if (btn) {
      btn.disabled = false;
    }
  }
}

/**
 * Render Daftar Kategori dari In-Memory Data Store (Database Synced)
 */
function renderCategories() {
  const categories = typeof window.getCategories === 'function' ? window.getCategories() : [];
  
  if (!categoriesContainer) return;

  if (categories.length === 0) {
    if (emptyStateCategories) emptyStateCategories.classList.remove('d-none');
    if (btnAddCategoryTop) btnAddCategoryTop.classList.add('d-none');
    categoriesContainer.innerHTML = '';
    return;
  }
  
  if (emptyStateCategories) emptyStateCategories.classList.add('d-none');
  if (btnAddCategoryTop) btnAddCategoryTop.classList.remove('d-none');
  categoriesContainer.innerHTML = '';

  categories.forEach(cat => {
    const hasSubcats = cat.subcategories && cat.subcategories.length > 0;
    
    const row = document.createElement('div');
    row.className = 'category-item-card p-3 mb-3 bg-white shadow-sm rounded-3 border';
    
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
        ? 'category-icon-box bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center'
        : 'category-icon-box bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center';
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
    amountBadge.className = 'category-amount-badge fw-bold text-dark font-monospace px-3 py-1 rounded-2 bg-light border';
    amountBadge.textContent = window.formatRupiah ? window.formatRupiah(cat.budget) : 'Rp ' + cat.budget;
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
        subItem.className = 'subcat-item d-flex align-items-center justify-content-between p-2 rounded bg-light bg-opacity-50';
        
        const subName = document.createElement('span');
        subName.className = 'text-secondary fw-medium small';
        subName.innerHTML = `<i class="bi bi-arrow-return-right me-2 text-primary"></i>${sub.name}`;
        
        const subVal = document.createElement('span');
        subVal.className = 'fw-semibold text-dark small font-monospace';
        subVal.textContent = window.formatRupiah ? window.formatRupiah(sub.budget) : 'Rp ' + sub.budget;
        
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

/**
 * Update Ringkasan Alokasi Budget di Footer
 */
function updateAllocationSummary() {
  if (!allocatedText || !allocationProgress || !allocationBadge) return;

  const budgetData = typeof window.getBudget === 'function' ? window.getBudget() : { totalBudget: 0, categories: [] };
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
  if (categoryModal) categoryModal.showModal();
}

function openEditCategoryModal(catId) {
  const cat = typeof window.getCategoryById === 'function' ? window.getCategoryById(catId) : null;
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
  if (categoryModal) categoryModal.showModal();
}

function closeCategoryModal() {
  if (categoryModal) categoryModal.close();
}

function addSubcatInputRow(name = '', budget = 0, id = null) {
  const container = document.getElementById('subcat-list-container');
  if (!container) return;

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
    if (typeof window.showAppModal === 'function') {
      window.showAppModal({
        title: 'Gagal Menyimpan Kategori',
        message: err.message || 'Terjadi kesalahan saat menyimpan kategori.',
        type: 'danger'
      });
    }
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
  if (deleteConfirmModal) deleteConfirmModal.showModal();
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
    if (deleteConfirmModal) deleteConfirmModal.close();
    currentDeleteId = null;
  }
}
