// js/invite.js

import { showMessageWithIcon, getToken, API_URL, logout } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = getToken();
  if (!token) {
    logout();
  }

  const inviteForm = document.getElementById("invite-form");
  const userEmailInput = document.getElementById("user-email");
  const tempPasswordInput = document.getElementById("temp-password");
  const userRoleInput = document.getElementById("user-role");

  const INVITE_ENDPOINT = `${API_URL}/users/invite`;

  if (inviteForm) {
    inviteForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = userEmailInput.value;
      const password = tempPasswordInput.value;
      const role = userRoleInput.value;

      try {
        const response = await fetch(INVITE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, password, role }),
        });

        const data = await response.json();

        if (response.ok) {
          showMessageWithIcon(
            "Success!",
            `User ${email} has been successfully invited.`,
            "success"
          );
          inviteForm.reset();
        } else {
          showMessageWithIcon(
            "Invitation Failed",
            data.detail || "Failed to invite user.",
            "error"
          );
        }
      } catch (error) {
        console.error("Invitation error:", error);
        showMessageWithIcon(
          "Error",
          "An unexpected error occurred. Please try again.",
          "error"
        );
      }
    });
  }
});
