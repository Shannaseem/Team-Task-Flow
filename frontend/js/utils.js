// js/utils.js

export const API_URL = "http://localhost:8000";

// Modal elements
const modalOverlay = document.getElementById("message-modal-overlay");
const modalContent = document.querySelector(".modal-content");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalOkButton = document.getElementById("modal-ok-button");
const modalConfirmButtons = document.getElementById("modal-confirm-buttons");
const modalConfirmOk = document.getElementById("modal-confirm-ok");
const modalConfirmCancel = document.getElementById("modal-confirm-cancel");

/**
 * Hides the modal.
 */
function hideModal() {
  if (modalOverlay) {
    modalOverlay.style.display = "none";
    // Clean up classes after hiding
    if (modalContent) {
      modalContent.classList.remove("success", "error", "info");
    }
  }
}

/**
 * Shows a message in a modal with a single OK button.
 * @param {string} title - The title of the message.
 * @param {string} message - The message text to display.
 */
export function showMessage(title, message) {
  if (modalContent) {
    modalContent.classList.remove("success", "error", "info");
  }
  if (modalOverlay && modalTitle && modalMessage && modalOkButton) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalOkButton.style.display = "block";
    if (modalConfirmButtons) {
      modalConfirmButtons.style.display = "none";
    }
    modalOverlay.style.display = "flex";
  }
}

/**
 * Shows a message with a specific class for styling and an icon.
 * @param {string} title - The title of the message.
 * @param {string} message - The message text to display.
 * @param {string} type - The type of message (e.g., 'success', 'error', 'info').
 */
export function showMessageWithIcon(title, message, type) {
  if (modalContent) {
    modalContent.classList.remove("success", "error", "info");
    if (type) {
      modalContent.classList.add(type);
    }
  }

  if (modalOverlay && modalTitle && modalMessage && modalOkButton) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalOkButton.style.display = "block";
    if (modalConfirmButtons) {
      modalConfirmButtons.style.display = "none";
    }
    modalOverlay.style.display = "flex";
  }
}

/**
 * Shows a confirmation dialog with Confirm and Cancel buttons.
 * @param {string} title - The title of the confirmation.
 * @param {string} message - The confirmation message text.
 * @param {function} onConfirm - Callback function to execute on confirm.
 * @param {function} [onCancel] - Optional callback function to execute on cancel.
 */
export function showConfirm(title, message, onConfirm, onCancel) {
  if (modalContent) {
    modalContent.classList.remove("success", "error", "info");
  }
  if (
    modalOverlay &&
    modalTitle &&
    modalMessage &&
    modalOkButton &&
    modalConfirmButtons
  ) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalOkButton.style.display = "none";
    modalConfirmButtons.style.display = "flex";
    modalOverlay.style.display = "flex";

    // Clear previous event listeners
    modalConfirmOk.onclick = null;
    modalConfirmCancel.onclick = null;

    modalConfirmOk.onclick = () => {
      hideModal();
      if (onConfirm) onConfirm();
    };

    modalConfirmCancel.onclick = () => {
      hideModal();
      if (onCancel) onCancel();
    };
  }
}

// Event listener for the modal OK button
if (modalOkButton) {
  modalOkButton.addEventListener("click", hideModal);
}

/**
 * Retrieves the JWT token from local storage.
 * @returns {string|null} The token or null if not found.
 */
export function getToken() {
  return localStorage.getItem("token");
}

/**
 * Removes the token and redirects to the login page.
 */
export function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}
