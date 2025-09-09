import {
  API_URL,
  getToken,
  logout,
  showMessageWithIcon,
  initializeModalListeners,
} from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = getToken();
  if (token) {
    window.location.href = "dashboard.html";
    return;
  }

  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) loadingScreen.style.display = "none"; // Hide on load if no token

  initializeModalListeners(); // Initialize modal close listeners

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email")?.value?.trim();
      const password = document.getElementById("password")?.value;

      if (!loadingScreen) return; // Safety check
      loadingScreen.style.display = "flex"; // Show loading

      if (!email || !password) {
        loadingScreen.style.display = "none";
        showMessageWithIcon(
          "Error",
          "Email and password are required.",
          "error"
        );
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        loadingScreen.style.display = "none";
        showMessageWithIcon(
          "Error",
          "Please enter a valid email address.",
          "error"
        );
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        console.log("Login response:", data);
        if (response.ok) {
          if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            showMessageWithIcon("Success", "Login successful!", "success");
            setTimeout(() => (window.location.href = "dashboard.html"), 1500);
          } else {
            loadingScreen.style.display = "none";
            showMessageWithIcon(
              "Error",
              "No token received from server.",
              "error"
            );
          }
        } else {
          loadingScreen.style.display = "none";
          showMessageWithIcon(
            "Error",
            data.detail || "Login failed. Please try again.",
            "error"
          );
        }
      } catch (error) {
        console.error("Login error:", error);
        loadingScreen.style.display = "none";
        showMessageWithIcon(
          "Error",
          "Unable to connect to server. Check your network.",
          "error"
        );
      }
    });
  }

  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const tenantName = document.getElementById("tenant-name")?.value?.trim();
      const email = document.getElementById("email")?.value?.trim();
      const password = document.getElementById("password")?.value;

      if (!loadingScreen) return; // Safety check
      loadingScreen.style.display = "flex"; // Show loading

      if (!tenantName || !email || !password) {
        loadingScreen.style.display = "none";
        showMessageWithIcon("Error", "All fields are required.", "error");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        loadingScreen.style.display = "none";
        showMessageWithIcon(
          "Error",
          "Please enter a valid email address.",
          "error"
        );
        return;
      }
      if (password.length < 8) {
        loadingScreen.style.display = "none";
        showMessageWithIcon(
          "Error",
          "Password must be at least 8 characters long.",
          "error"
        );
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenant_name: tenantName, email, password }),
        });
        const data = await response.json();

        console.log("Signup response:", data);
        if (response.ok) {
          if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            showMessageWithIcon(
              "Success",
              "Signup successful! Redirecting...",
              "success"
            );
            setTimeout(() => (window.location.href = "dashboard.html"), 2000);
          } else {
            loadingScreen.style.display = "none";
            showMessageWithIcon(
              "Error",
              "No token received from server.",
              "error"
            );
          }
        } else {
          loadingScreen.style.display = "none";
          showMessageWithIcon(
            "Error",
            data.detail || "Signup failed. Please try again.",
            "error"
          );
        }
      } catch (error) {
        console.error("Signup error:", error);
        loadingScreen.style.display = "none";
        showMessageWithIcon(
          "Error",
          "Unable to connect to server. Check your network.",
          "error"
        );
      }
    });
  }
});
