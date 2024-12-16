const API_BASE_URL = "https://api.noroff.dev/auction";

/**
 * Utility function to handle API requests.
 * @param {string} endpoint - API endpoint.
 * @param {string} method - HTTP method (GET, POST, etc.).
 * @param {Object} [data] - Request body data.
 * @param {boolean} [requiresAuth=false] - Whether the request requires authorization.
 * @returns {Promise<Object>} - Response data from the API.
 */
async function apiRequest(endpoint, method = "GET", data = null, requiresAuth = false) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { "Content-Type": "application/json" };

  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      throw new Error("User is not authenticated.");
    }
  }

  const options = { method, headers };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "API request failed.");
  }

  return response.json();
}

/**
 * User login.
 * @param {string} email - User email.
 * @param {string} password - User password.
 * @returns {Promise<Object>} - User data and access token.
 */
async function login(email, password) {
  return apiRequest("/auth/login", "POST", { email, password });
}

/**
 * User registration.
 * @param {string} username - User's username.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<Object>} - Registered user data.
 */
async function register(username, email, password) {
  return apiRequest("/auth/register", "POST", { username, email, password });
}

/**
 * Fetch user profile details.
 * @returns {Promise<Object>} - User profile details.
 */
async function fetchProfile() {
  return apiRequest("/auth/profile", "GET", null, true);
}

/**
 * Update user avatar.
 * @param {File} avatar - Avatar image file.
 * @returns {Promise<Object>} - Updated user profile details.
 */
async function updateAvatar(avatar) {
  const url = `${API_BASE_URL}/auth/avatar`;
  const formData = new FormData();
  formData.append("avatar", avatar);

  const token = localStorage.getItem("token");
  if (!token) throw new Error("User is not authenticated.");

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update avatar.");
  }

  return response.json();
}

/**
 * Fetch listings.
 * @param {string} [searchQuery] - Optional search query for filtering listings.
 * @returns {Promise<Object[]>} - Array of listings.
 */
async function fetchListings(searchQuery = "") {
  const endpoint = searchQuery ? `/listings?search=${encodeURIComponent(searchQuery)}` : "/listings";
  return apiRequest(endpoint);
}

/**
 * Fetch a single listing by ID.
 * @param {string} listingId - ID of the listing.
 * @returns {Promise<Object>} - Listing details.
 */
async function fetchListingById(listingId) {
  return apiRequest(`/listings/${listingId}`);
}

/**
 * Place a bid on a listing.
 * @param {string} listingId - ID of the listing.
 * @param {number} amount - Bid amount.
 * @returns {Promise<Object>} - Updated listing with the new bid.
 */
async function placeBid(listingId, amount) {
  return apiRequest(`/listings/${listingId}/bids`, "POST", { amount }, true);
}

/**
 * Create a new listing.
 * @param {Object} listingData - Data for the new listing (title, description, etc.).
 * @param {File[]} mediaFiles - Array of media files to upload.
 * @returns {Promise<Object>} - Created listing details.
 */
async function createListing(listingData, mediaFiles = []) {
  const url = `${API_BASE_URL}/listings`;
  const formData = new FormData();

  // Add listing data to formData
  Object.keys(listingData).forEach((key) => {
    formData.append(key, listingData[key]);
  });

  // Add media files to formData
  mediaFiles.forEach((file) => {
    formData.append("media", file);
  });

  const token = localStorage.getItem("token");
  if (!token) throw new Error("User is not authenticated.");

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create listing.");
  }

  return response.json();
}

export {
  login,
  register,
  fetchProfile,
  updateAvatar,
  fetchListings,
  fetchListingById,
  placeBid,
  createListing,
};
