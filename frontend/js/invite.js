// frontend/js/invite.js
import {
  showMessageWithIcon,
  getToken,
  API_URL,
  initializeModalListeners,
} from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeModalListeners();

  const form = document.getElementById("invite-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("invite-email")?.value?.trim();

      if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
        showMessageWithIcon(
          "Error",
          "Please enter a valid email address.",
          "error"
        );
        return;
      }

      try {
        const token = getToken();
        const response = await fetch(`${API_URL}/users/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (response.ok) {
          showMessageWithIcon(
            "Success",
            `Invitation sent to ${email}.`,
            "success"
          );
          form.reset();
        } else {
          showMessageWithIcon(
            "Error",
            data.detail || "Failed to send invitation.",
            "error"
          );
        }
      } catch (error) {
        console.error("Invite error:", error);
        showMessageWithIcon("Error", "An unexpected error occurred.", "error");
      }
    });
  }
});
