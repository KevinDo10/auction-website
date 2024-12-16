// ==========================
// API Configuration
// ==========================
const API_BASE_URL = "https://api.noroff.dev/auction";

/**
 * Utility function to make API requests.
 * @param {string} endpoint - API endpoint.
 * @param {string} method - HTTP method (GET, POST, etc.).
 * @param {Object} [body=null] - Request payload.
 * @param {boolean} [requiresAuth=false] - Whether the request requires authentication.
 * @returns {Promise<Object>} - API response data.
 */
async function apiRequest(endpoint, method = "GET", body = null, requiresAuth = false) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Unauthorized access. Please log in.");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body instanceof FormData) {
    delete headers["Content-Type"]; // Let the browser set it for FormData
    options.body = body;
  } else if (body) {
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
// Profile: Fetch and Display
// ==========================
/**
 * Load and display the user's profile details.
 */
async function loadProfile() {
  const profileDetailsContainer = document.getElementById("profileDetails");
  const totalCreditsElement = document.getElementById("totalCredits");

  if (!profileDetailsContainer || !totalCreditsElement) return;

  try {
    const user = await apiRequest("/auth/profile", "GET", null, true);

    // Display user profile details
    profileDetailsContainer.innerHTML = `
      <img src="${user.avatar || '../assets/images/default-avatar.png'}" alt="Avatar" class="profile-avatar">
      <p><strong>Username:</strong> ${user.username}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    `;

    // Display total credits
    totalCreditsElement.textContent = `${user.credits} Credits`;
  } catch (error) {
    console.error("Error loading profile:", error);
    profileDetailsContainer.innerHTML = `<p class="error">Failed to load profile details. Please try again later.</p>`;
    totalCreditsElement.textContent = "N/A";
  }
}

// ==========================
// Avatar Update
// ==========================
/**
 * Handle the avatar update process.
 * @param {Event} event - Form submission event.
 */
async function updateAvatar(event) {
  event.preventDefault();

  const avatarInput = document.getElementById("avatarInput").files[0];
  const avatarStatusMessage = document.getElementById("avatarStatusMessage");

  if (!avatarInput) {
    avatarStatusMessage.textContent = "Please select a file.";
    avatarStatusMessage.style.color = "red";
    return;
  }

  avatarStatusMessage.textContent = "Uploading avatar...";
  avatarStatusMessage.style.color = "black";

  const formData = new FormData();
  formData.append("avatar", avatarInput);

  try {
    await apiRequest("/auth/avatar", "POST", formData, true);

    avatarStatusMessage.textContent = "Avatar updated successfully!";
    avatarStatusMessage.style.color = "green";

    // Refresh the profile to show the updated avatar
    loadProfile();
  } catch (error) {
    console.error("Error updating avatar:", error);
    avatarStatusMessage.textContent = "Failed to update avatar. Please try again.";
    avatarStatusMessage.style.color = "red";
  }
}

// ==========================
// Logout Functionality
// ==========================
/**
 * Log out the current user and redirect to the login page.
 */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../pages/login.html"; // Redirect to login page
}

// ==========================
// Event Listeners
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const avatarForm = document.getElementById("avatarForm");
  const logoutLink = document.getElementById("logoutLink");

  // Load user profile on page load
  loadProfile();

  // Handle avatar update
  if (avatarForm) {
    avatarForm.addEventListener("submit", updateAvatar);
  }

  // Handle logout
  if (logoutLink) {
    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
    });
  }
});
