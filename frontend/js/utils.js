// Configurable API URL (can be overridden via environment variables in production)
const API_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  try {
    localStorage.removeItem("token");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout error:", error);
    showMessageWithIcon(
      "Error",
      "Failed to log out. Please try again.",
      "error"
    );
  }
}

function showMessageWithIcon(title, message, type, autoCloseMs = 3000) {
  const modal = document.getElementById("message-modal-overlay");
  const titleEl = document.getElementById("message-title");
  const textEl = document.getElementById("message-text");
  const iconEl = document.getElementById("message-icon");
  const okBtn = document.getElementById("message-ok-btn");

  if (!modal || !titleEl || !textEl || !iconEl || !okBtn) {
    console.warn("Message modal elements not found; falling back to alert.");
    alert(`${title}: ${message}`);
    return;
  }

  // Set content
  titleEl.textContent = title;
  textEl.textContent = message;
  iconEl.className = `modal-icon fas ${
    type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
  }`;

  // Show modal
  modal.style.display = "flex";

  // Add listeners if not already added
  if (!okBtn.dataset.listener) {
    okBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
    okBtn.dataset.listener = "true";
  }

  // Auto-close for success, manual close for error
  if (type === "success" && autoCloseMs > 0) {
    setTimeout(() => {
      modal.style.display = "none";
    }, autoCloseMs);
  } else {
    modal.dataset.type = type; // For potential future use (e.g., styling)
  }
}

function confirmAction(title, message, onConfirm) {
  const modal = document.getElementById("confirm-modal-overlay");
  const titleEl = document.getElementById("confirm-title");
  const messageEl = document.getElementById("confirm-message");
  const confirmBtn = document.getElementById("confirm-ok-btn");

  if (!modal || !titleEl || !messageEl || !confirmBtn) {
    console.warn("Confirm modal elements not found; falling back to confirm.");
    if (window.confirm(`${title}: ${message}`)) {
      onConfirm();
    }
    return;
  }

  titleEl.textContent = title;
  messageEl.textContent = message;
  modal.style.display = "flex";

  // Ensure a single event listener
  if (!confirmBtn.dataset.listener) {
    confirmBtn.addEventListener("click", async () => {
      try {
        await onConfirm();
      } catch (error) {
        console.error("Confirm action error:", error);
        showMessageWithIcon("Error", "Action failed.", "error");
      }
      modal.style.display = "none";
    });
    confirmBtn.dataset.listener = "true";
  }
}

function initializeModalListeners() {
  const closeButtons = document.querySelectorAll(
    ".modal-close-btn, #message-ok-btn, #confirm-ok-btn"
  );
  closeButtons.forEach((button) => {
    if (!button.dataset.listener) {
      button.addEventListener("click", () => {
        const modal = button.closest(".modal-overlay");
        if (modal) {
          modal.style.display = "none";
        }
      });
      button.dataset.listener = "true";
    }
  });
}

// Expose functions and API_URL globally for non-module scripts
window.API_URL = API_URL;
window.getToken = getToken;
window.logout = logout;
window.showMessageWithIcon = showMessageWithIcon;
window.confirmAction = confirmAction;
window.initializeModalListeners = initializeModalListeners;

// Export for ES modules
export {
  API_URL,
  getToken,
  logout,
  showMessageWithIcon,
  confirmAction,
  initializeModalListeners,
};
