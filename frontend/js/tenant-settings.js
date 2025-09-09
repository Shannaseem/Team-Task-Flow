import {
  API_URL,
  getToken,
  showMessageWithIcon,
  logout,
  initializeModalListeners,
} from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  initializeModalListeners(); // Ensure modals work on this page

  const token = getToken();
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const tenantNameForm = document.getElementById("tenant-name-form");
  const tenantNameInput = document.getElementById("tenant-name");

  if (!tenantNameForm || !tenantNameInput) {
    console.error("Tenant settings form or input not found.");
    return;
  }

  // Fetch current tenant name and populate the input field
  try {
    const response = await fetch(`${API_URL}/tenants/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const tenantData = await response.json();
      tenantNameInput.value = tenantData.name;
    } else {
      const errorData = await response.json();
      showMessageWithIcon(
        "Error",
        errorData.detail || "Failed to fetch tenant details.",
        "error"
      );
    }
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    showMessageWithIcon("Error", "An unexpected error occurred.", "error");
  }

  tenantNameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newTenantName = tenantNameInput.value.trim();

    if (!newTenantName) {
      showMessageWithIcon("Error", "Team name cannot be empty.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tenants/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTenantName }),
      });

      const data = await response.json();
      if (response.ok) {
        showMessageWithIcon(
          "Success",
          "Team name updated successfully!",
          "success"
        );
      } else {
        showMessageWithIcon(
          "Error",
          data.detail || "Failed to update team name.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating team name:", error);
      showMessageWithIcon("Error", "An unexpected error occurred.", "error");
    }
  });

  // Sidebar navigation
  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  const dashboardLink = document.querySelector(
    '.sidebar-btn[href="dashboard.html"]'
  );
  if (dashboardLink) {
    dashboardLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "dashboard.html";
    });
  }
});
