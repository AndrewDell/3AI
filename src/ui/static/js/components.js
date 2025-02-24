/**
 * components.js
 *
 * 🚀 **Modular JavaScript Components for 3AI Dashboard**
 * This file defines reusable UI elements such as:
 * - Modals
 * - Tooltips
 * - Toast Notifications
 * - Dark Mode Toggle
 * - Loading Spinners
 *
 * 📌 **Best Practices**
 * - Uses **ES6 modules** for maintainability.
 * - Follows **ARIA accessibility** standards.
 * - Optimized for **performance & responsiveness**.
 */

/**
 * UI Components for 3AI Dashboard
 * 
 * Reusable UI components and utilities including:
 * 1. Toast notifications
 * 2. Modal dialogs
 * 3. Loading indicators
 * 4. Animations and transitions
 * 5. Form validation helpers
 */

// Configuration
const UI_CONFIG = {
  animationDuration: 300,
  toastDuration: 3000,
  toastPosition: 'top-right',
  modalZIndex: 1000,
  classes: {
    toast: {
      base: 'toast',
      success: 'toast-success',
      error: 'toast-error',
      warning: 'toast-warning',
      info: 'toast-info'
    },
    modal: {
      overlay: 'modal-overlay',
      content: 'modal-content',
      header: 'modal-header',
      body: 'modal-body',
      footer: 'modal-footer'
    }
  }
};

/**
 * 📌 Show a reusable modal dialog.
 * @param {string} title - Modal title.
 * @param {string} message - Modal message content.
 */
export function showModal(title, message) {
  const overlay = document.createElement("div");
  overlay.classList.add("modal-overlay");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const modal = document.createElement("div");
  modal.classList.add("modal-content");

  const modalHeader = document.createElement("h2");
  modalHeader.textContent = title;

  const modalBody = document.createElement("p");
  modalBody.textContent = message;

  const closeButton = document.createElement("button");
  closeButton.classList.add("btn");
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  modal.appendChild(modalHeader);
  modal.appendChild(modalBody);
  modal.appendChild(closeButton);
  overlay.appendChild(modal);
  
  document.body.appendChild(overlay);
  closeButton.focus();
}

/**
 * Toast Notification System
 * Shows temporary notifications to users
 */
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const id = `toast-${Date.now()}`;
  
  toast.id = id;
  toast.className = `${UI_CONFIG.classes.toast.base} ${UI_CONFIG.classes.toast[type]}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="toast-icon">${getToastIcon(type)}</span>
      <p>${message}</p>
    </div>
  `;

  // Position the toast
  toast.style.cssText = `
    position: fixed;
    ${UI_CONFIG.toastPosition.includes('top') ? 'top: 1rem;' : 'bottom: 1rem;'}
    ${UI_CONFIG.toastPosition.includes('right') ? 'right: 1rem;' : 'left: 1rem;'}
    z-index: ${UI_CONFIG.modalZIndex + 1};
  `;

  document.body.appendChild(toast);
  fadeIn(toast);

  // Remove toast after duration
  setTimeout(() => {
    fadeOut(toast).then(() => toast.remove());
  }, UI_CONFIG.toastDuration);

  return id;
}

/**
 * Animation Utilities
 * Smooth transitions for UI elements
 */
export function fadeIn(element) {
  return new Promise(resolve => {
    element.style.opacity = '0';
    element.style.display = 'block';
    element.style.transition = `opacity ${UI_CONFIG.animationDuration}ms ease`;

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      setTimeout(resolve, UI_CONFIG.animationDuration);
    });
  });
}

export function fadeOut(element) {
  return new Promise(resolve => {
    element.style.opacity = '1';
    element.style.transition = `opacity ${UI_CONFIG.animationDuration}ms ease`;

    requestAnimationFrame(() => {
      element.style.opacity = '0';
      setTimeout(() => {
        element.style.display = 'none';
        resolve();
      }, UI_CONFIG.animationDuration);
    });
  });
}

/**
 * Helper Functions
 */
function getToastIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

/**
 * Form Validation Helpers
 */
export const validators = {
  required: value => !!value.trim() || 'This field is required',
  email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email address',
  minLength: min => value => value.length >= min || `Minimum length is ${min} characters`,
  maxLength: max => value => value.length <= max || `Maximum length is ${max} characters`,
  pattern: (regex, message) => value => regex.test(value) || message
};

/**
* 📌 Dark Mode Toggle.
*/
export function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

/**
* 📌 Initialize dark mode settings on page load.
*/
export function initDarkMode() {
  if (localStorage.getItem("darkMode") === "true") {
      document.body.classList.add("dark-mode");
  }
}

/**
* 📌 Utility function to debounce function calls.
* @param {Function} func - The function to debounce.
* @param {number} wait - Delay in milliseconds.
* @returns {Function} - Debounced function.
*/
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
      const later = () => {
          clearTimeout(timeout);
          func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
  };
}

/**
* 📌 Show a loading spinner.
*/
export function showLoadingSpinner() {
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  document.body.appendChild(spinner);
}

/**
* 📌 Hide the loading spinner.
*/
export function hideLoadingSpinner() {
  const spinner = document.querySelector(".loading-spinner");
  if (spinner) {
      spinner.remove();
  }
}
