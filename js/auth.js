// ==========================
// API Configuration
// ==========================
const API_BASE_URL = "https://api.noroff.dev/auction";

// Utility function to make API requests
async function apiRequest(endpoint, method = "POST", body = null, requiresAuth = false) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("User is not authenticated.");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Something went wrong with the API request.");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
}

// ==========================
// User Authentication
// ==========================

// Register a new user
async function registerUser(username, email, password) {
  return apiRequest("/auth/register", "POST", { username, email, password });
}

// Log in an existing user
async function loginUser(email, password) {
  const response = await apiRequest("/auth/login", "POST", { email, password });

  // Save token and user details in localStorage
  localStorage.setItem("token", response.accessToken);
  localStorage.setItem("user", JSON.stringify(response));
  return response;
}

// Log out the current user
function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../pages/login.html"; // Redirect to the login page
}

// Check if the user is logged in
function isUserLoggedIn() {
  return !!localStorage.getItem("token");
}

// Get the logged-in user's details
function getLoggedInUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// ==========================
// Event Listeners for Authentication
// ==========================

// Handle registration form submission
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const registerStatusMessage = document.getElementById("registerStatusMessage");

    if (!username || !email || !password || !confirmPassword) {
      registerStatusMessage.textContent = "All fields are required.";
      registerStatusMessage.style.color = "red";
      return;
    }

    if (!email.endsWith("@stud.noroff.no")) {
      registerStatusMessage.textContent = "Email must be a valid @stud.noroff.no address.";
      registerStatusMessage.style.color = "red";
      return;
    }

    if (password !== confirmPassword) {
      registerStatusMessage.textContent = "Passwords do not match.";
      registerStatusMessage.style.color = "red";
      return;
    }

    registerStatusMessage.textContent = "Registering...";
    registerStatusMessage.style.color = "black";

    try {
      await registerUser(username, email, password);
      registerStatusMessage.textContent = "Registration successful! Redirecting to login...";
      registerStatusMessage.style.color = "green";

      setTimeout(() => {
        window.location.href = "../pages/login.html";
      }, 2000);
    } catch (error) {
      registerStatusMessage.textContent = `Error: ${error.message}`;
      registerStatusMessage.style.color = "red";
    }
  });
}

// Handle login form submission
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const loginStatusMessage = document.getElementById("loginStatusMessage");

    if (!email || !password) {
      loginStatusMessage.textContent = "Both fields are required.";
      loginStatusMessage.style.color = "red";
      return;
    }

    loginStatusMessage.textContent = "Logging in...";
    loginStatusMessage.style.color = "black";

    try {
      await loginUser(email, password);
      loginStatusMessage.textContent = "Login successful! Redirecting to your profile...";
      loginStatusMessage.style.color = "green";

      setTimeout(() => {
        window.location.href = "../pages/profile.html";
      }, 2000);
    } catch (error) {
      loginStatusMessage.textContent = `Error: ${error.message}`;
      loginStatusMessage.style.color = "red";
    }
  });
}

// Logout functionality
const logoutButton = document.getElementById("logoutLink");
if (logoutButton) {
  logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    logoutUser();
  });
}
