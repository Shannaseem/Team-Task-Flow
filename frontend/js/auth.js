// js/auth.js

import { showMessage, showMessageWithIcon, API_URL } from "./utils.js";

// --------- LOGIN FORM HANDLER ----------
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    showMessageWithIcon("Error", "Please fill in all fields.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Step 1: JWT token ko turant save karein
      localStorage.setItem("token", data.access_token);

      // Step 2: Success message dikhayein
      showMessageWithIcon("Success!", "Login successful.", "success");

      // Step 3: Redirect karne se pehle 2 seconds ka wait karein
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 2000);
    } else {
      // Login fail hone par error message dikhayein
      showMessageWithIcon(
        "Login Failed",
        data.detail || "Login failed",
        "error"
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    showMessageWithIcon(
      "Error",
      "An unexpected error occurred. Please try again.",
      "error"
    );
  }
});

// --------- SIGNUP FORM HANDLER ----------
document
  .getElementById("signup-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tenantName = document.getElementById("tenant-name")?.value;
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_name: tenantName, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // **Yahan badlaav kiya gaya hai**
        // Signup successful. Ab token save karein aur dashboard par redirect karein.
        localStorage.setItem("token", data.access_token);
        showMessageWithIcon(
          "Success!",
          "Account created successfully. Redirecting to dashboard...",
          "success"
        );
        setTimeout(() => {
          window.location.href = "dashboard.html"; // Seedha dashboard par redirect
        }, 2000);
      } else {
        // Signup error ko handle karein
        if (data.detail === "Email pehle se registerd hai") {
          showMessageWithIcon(
            "Signup Failed",
            "This email is already registered. Please use a different email or log in.",
            "error"
          );
        } else if (data.detail === "Team name pehle se registerd hai") {
          showMessageWithIcon(
            "Signup Failed",
            "This team name is already taken. Please choose a different one.",
            "error"
          );
        } else {
          showMessageWithIcon(
            "Signup Failed",
            data.detail || "Signup failed",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      showMessageWithIcon(
        "Error",
        "An unexpected error occurred. Please try again.",
        "error"
      );
    }
  });
