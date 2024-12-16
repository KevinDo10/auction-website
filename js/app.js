// ==========================
// API Configuration
// ==========================
const API_BASE_URL = "https://api.noroff.dev/auction";

// Utility function to make API requests
async function apiRequest(endpoint, method = "GET", body = null, requiresAuth = false) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Authorization token is missing.");
      throw new Error("Unauthorized access. Please log in.");
    }
    headers["Authorization"] = `Bearer ${token}`;
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
// User Session Management
// ==========================

// Check if the user is logged in
function isLoggedIn() {
  return !!localStorage.getItem("token");
}

// Get the logged-in user's information
function getUserInfo() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// Log out the user
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html"; // Redirect to login page
}

// ==========================
// Navigation Handling
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-links a");
  const logoutLink = document.querySelector("#logoutLink");

  // Highlight active navigation link
  navLinks.forEach((link) => {
    if (link.href === window.location.href) {
      link.classList.add("active");
    }
  });

  // Add logout functionality if the logout link is present
  if (logoutLink) {
    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
    });
  }

  // Update navigation based on login state
  updateNavBasedOnLogin();
});

// Update navigation links dynamically based on user login state
function updateNavBasedOnLogin() {
  const navLinksContainer = document.querySelector(".nav-links");
  if (!navLinksContainer) return;

  if (isLoggedIn()) {
    navLinksContainer.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="profile.html">Profile</a></li>
      <li><a id="logoutLink" href="#">Logout</a></li>
    `;
  } else {
    navLinksContainer.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="login.html">Login</a></li>
      <li><a href="register.html">Register</a></li>
    `;
  }
}

// ==========================
// Utility Functions
// ==========================

// Format a date string into a readable format
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Display a message to the user
function displayMessage(containerId, message, type = "info") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.textContent = message;
  container.className = `status-message ${type}`;
}

// Clear a message from a container
function clearMessage(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.textContent = "";
    container.className = "status-message";
  }
}

// ==========================
// Page-Specific Logic
// ==========================

// Load featured listings on the homepage
async function loadFeaturedListings() {
  const listingsContainer = document.getElementById("listingsGrid");
  if (!listingsContainer) return;

  try {
    const listings = await apiRequest("/listings", "GET");

    listingsContainer.innerHTML = listings
      .slice(0, 4) // Show only the first 4 listings
      .map(
        (listing) => `
          <div class="listing-card">
            <img src="${listing.media[0] || "assets/images/default.jpg"}" alt="${listing.title}" class="listing-image">
            <h3>${listing.title}</h3>
            <p>${listing.description.slice(0, 100)}...</p>
            <p><strong>Ends At:</strong> ${formatDate(listing.endsAt)}</p>
            <a href="listing.html?id=${listing.id}" class="btn btn-secondary">View Listing</a>
          </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading featured listings:", error);
    listingsContainer.innerHTML = `<p class="error">Failed to load featured listings. Please try again later.</p>`;
  }
}

// ==========================
// Initialize Page Logic
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  // Load homepage-specific content
  if (window.location.pathname.includes("index.html")) {
    loadFeaturedListings();
  }
});
