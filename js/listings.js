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
// Listings: Fetch and Display
// ==========================
/**
 * Load and display featured listings (on the homepage).
 */
async function loadFeaturedListings() {
  const listingsContainer = document.getElementById("listingsGrid");
  if (!listingsContainer) return;

  try {
    const listings = await apiRequest("/listings");

    listingsContainer.innerHTML = listings
      .slice(0, 4) // Show only the first 4 listings
      .map(
        (listing) => `
          <div class="listing-card">
            <img src="${listing.media[0] || "../assets/images/default.jpg"}" alt="${listing.title}" class="listing-image">
            <h3>${listing.title}</h3>
            <p>${listing.description.slice(0, 100)}...</p>
            <p><strong>Ends At:</strong> ${new Date(listing.endsAt).toLocaleString()}</p>
            <a href="../pages/listing.html?id=${listing.id}" class="btn btn-secondary">View Listing</a>
          </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading featured listings:", error);
    listingsContainer.innerHTML = `<p class="error">Failed to load featured listings. Please try again later.</p>`;
  }
}

/**
 * Load and display specific listing details.
 */
async function loadListingDetails() {
  const queryParams = new URLSearchParams(window.location.search);
  const listingId = queryParams.get("id");
  const listingDetailsContainer = document.getElementById("listingDetails");
  const bidsListContainer = document.getElementById("bidsList");

  if (!listingId || !listingDetailsContainer || !bidsListContainer) return;

  try {
    const listing = await apiRequest(`/listings/${listingId}`);
    const bids = listing.bids || [];

    listingDetailsContainer.innerHTML = `
      <h1>${listing.title}</h1>
      <img src="${listing.media[0] || "../assets/images/default.jpg"}" alt="${listing.title}" class="listing-image">
      <p>${listing.description}</p>
      <p><strong>Ends At:</strong> ${new Date(listing.endsAt).toLocaleString()}</p>
      <p><strong>Highest Bid:</strong> ${
        bids.length > 0 ? `${Math.max(...bids.map((bid) => bid.amount))} Credits` : "No bids yet"
      }</p>
    `;

    bidsListContainer.innerHTML = bids.length
      ? bids
          .map(
            (bid) => `
          <li>
            <strong>Bidder:</strong> ${bid.bidderName || "Anonymous"} - 
            <strong>Amount:</strong> ${bid.amount} Credits
          </li>
        `
          )
          .join("")
      : "<p>No bids yet.</p>";
  } catch (error) {
    console.error("Error loading listing details:", error);
    listingDetailsContainer.innerHTML = `<p class="error">Failed to load listing details. Please try again later.</p>`;
    bidsListContainer.innerHTML = `<p class="error">Failed to load bids. Please try again later.</p>`;
  }
}

// ==========================
// Create a New Listing
// ==========================
/**
 * Handle the creation of a new listing.
 */
async function createListing(event) {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const endsAt = document.getElementById("deadline").value.trim();
  const mediaInput = document.getElementById("media");
  const statusMessage = document.getElementById("statusMessage");

  if (!title || !description || !endsAt) {
    statusMessage.textContent = "All fields are required.";
    statusMessage.style.color = "red";
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("endsAt", endsAt);

  Array.from(mediaInput.files).forEach((file) => {
    formData.append("media", file);
  });

  try {
    const newListing = await apiRequest("/listings", "POST", formData, true);

    statusMessage.textContent = "Listing created successfully!";
    statusMessage.style.color = "green";

    setTimeout(() => {
      window.location.href = `../pages/listing.html?id=${newListing.id}`;
    }, 2000);
  } catch (error) {
    console.error("Error creating listing:", error);
    statusMessage.textContent = `Error: ${error.message}`;
    statusMessage.style.color = "red";
  }
}

// ==========================
// Place a Bid
// ==========================
/**
 * Place a bid on a listing.
 */
async function placeBid(event) {
  event.preventDefault();

  const queryParams = new URLSearchParams(window.location.search);
  const listingId = queryParams.get("id");
  const bidAmount = parseFloat(document.getElementById("bidAmount").value);
  const bidStatusMessage = document.getElementById("bidStatusMessage");

  if (!listingId || isNaN(bidAmount) || bidAmount <= 0) {
    bidStatusMessage.textContent = "Please enter a valid bid amount.";
    bidStatusMessage.style.color = "red";
    return;
  }

  try {
    await apiRequest(`/listings/${listingId}/bids`, "POST", { amount: bidAmount }, true);

    bidStatusMessage.textContent = "Bid placed successfully!";
    bidStatusMessage.style.color = "green";

    // Refresh listing details and bids
    loadListingDetails();
  } catch (error) {
    console.error("Error placing bid:", error);
    bidStatusMessage.textContent = `Error: ${error.message}`;
    bidStatusMessage.style.color = "red";
  }
}

// ==========================
// Initialize Page Logic
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("listingsGrid")) {
    loadFeaturedListings();
  }

  if (document.getElementById("listingDetails")) {
    loadListingDetails();
  }

  const createListingForm = document.getElementById("createListingForm");
  if (createListingForm) {
    createListingForm.addEventListener("submit", createListing);
  }

  const bidForm = document.getElementById("bidForm");
  if (bidForm) {
    bidForm.addEventListener("submit", placeBid);
  }
});
