/* ============================================================
   BudgetKu — Custom Modern Alert & Notification Modal
   Replaces native browser alert() with a modern Bootstrap 5 modal.
   ============================================================ */

function showAppModal(options = {}) {
  let message = '';
  let title = '';
  let type = 'info'; // 'danger' | 'warning' | 'success' | 'info'
  let buttonText = 'Mengerti';
  let onConfirm = null;

  if (typeof options === 'string') {
    message = options;
  } else if (typeof options === 'object' && options !== null) {
    message = options.message || '';
    title = options.title || '';
    type = options.type || 'info';
    buttonText = options.buttonText || 'Mengerti';
    onConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : null;
  }

  // Set default title & icon style based on type
  let iconClass = 'bi-info-circle-fill';
  let badgeClass = 'bg-primary bg-opacity-10 text-primary';
  let btnClass = 'btn-primary';

  if (type === 'danger' || type === 'error') {
    if (!title) title = 'Terjadi Kesalahan';
    iconClass = 'bi-exclamation-octagon-fill';
    badgeClass = 'bg-danger bg-opacity-10 text-danger';
    btnClass = 'btn-danger';
  } else if (type === 'warning') {
    if (!title) title = 'Perhatian';
    iconClass = 'bi-exclamation-triangle-fill';
    badgeClass = 'bg-warning bg-opacity-10 text-warning';
    btnClass = 'btn-warning text-dark';
  } else if (type === 'success') {
    if (!title) title = 'Berhasil';
    iconClass = 'bi-check-circle-fill';
    badgeClass = 'bg-success bg-opacity-10 text-success';
    btnClass = 'btn-success';
  } else {
    if (!title) title = 'Pemberitahuan';
    iconClass = 'bi-info-circle-fill';
    badgeClass = 'bg-primary bg-opacity-10 text-primary';
    btnClass = 'btn-primary';
  }

  // Ensure modal DOM element exists
  let modalEl = document.getElementById('budgetkuAppModal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'budgetkuAppModal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-center p-4">
          <div class="modal-body p-0">
            <div id="budgetkuModalIconWrap" class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style="width: 64px; height: 64px;">
              <i id="budgetkuModalIcon" class="fs-1 bi"></i>
            </div>
            <h5 id="budgetkuModalTitle" class="fw-bold text-dark mb-2"></h5>
            <p id="budgetkuModalMessage" class="text-muted small mb-4 px-2" style="line-height: 1.5;"></p>
            <button type="button" id="budgetkuModalBtn" class="btn w-100 py-2 fw-semibold rounded-3 shadow-sm" data-bs-dismiss="modal">
              Mengerti
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  // Update content
  const iconWrap = modalEl.querySelector('#budgetkuModalIconWrap');
  const iconEl = modalEl.querySelector('#budgetkuModalIcon');
  const titleEl = modalEl.querySelector('#budgetkuModalTitle');
  const msgEl = modalEl.querySelector('#budgetkuModalMessage');
  const btnEl = modalEl.querySelector('#budgetkuModalBtn');

  if (iconWrap) iconWrap.className = `d-inline-flex align-items-center justify-content-center rounded-circle mb-3 ${badgeClass}`;
  if (iconEl) iconEl.className = `fs-1 bi ${iconClass}`;
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.innerHTML = message;
  if (btnEl) {
    btnEl.className = `btn w-100 py-2 fw-semibold rounded-3 shadow-sm ${btnClass}`;
    btnEl.textContent = buttonText;
  }

  // Show bootstrap modal
  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    
    // Cleanup previous listener
    const handleHidden = () => {
      modalEl.removeEventListener('hidden.bs.modal', handleHidden);
      if (onConfirm) onConfirm();
    };
    modalEl.addEventListener('hidden.bs.modal', handleHidden);
    
    bsModal.show();
  } else {
    // Fallback if bootstrap JS is not loaded
    if (window.originalAlert) {
      window.originalAlert(message);
    } else {
      alert(message);
    }
    if (onConfirm) onConfirm();
  }
}

// Override default window.alert with custom modern modal
if (!window.originalAlert) {
  window.originalAlert = window.alert;
  window.alert = function(msg) {
    showAppModal({ message: msg, type: 'warning' });
  };
}

window.showAppModal = showAppModal;
