/* ============================================================
   BudgetKu — Register Module (register.js)
   Handles user registration, budgetku_users storage,
   validation, and auto-login redirection.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      if (typeof window.handleRegisterSubmit === 'function') {
        window.handleRegisterSubmit(e);
      }
    });
  }
});
