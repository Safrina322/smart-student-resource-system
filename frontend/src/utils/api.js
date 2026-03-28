// ✅ Centralized API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Utility function to make API requests
 * @param {string} endpoint - API endpoint path (e.g., "/api/auth/login")
 * @param {object} options - fetch options
 * @returns {Promise} - response data
 */
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : { "Content-Type": "application/json" };
  
  try {
    const response = await fetch(url, {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    });

    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = {
        message: text?.startsWith("<!DOCTYPE")
          ? `Non-JSON response from ${url}. Check backend server and route availability.`
          : (text || "Unexpected non-JSON response"),
      };
    }

    if (!response.ok) {
      throw new Error(data.message || `API Error (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error);
    throw error;
  }
};

/**
 * Get API URL
 * @returns {string} - API base URL
 */
export const getApiUrl = () => API_BASE_URL;

/**
 * Get auth headers with token
 * @param {string} tokenType - "token" or "adminToken"
 * @returns {object} - Authorization headers
 */
export const getAuthHeader = (tokenType = "token") => {
  const token = localStorage.getItem(tokenType);
  return token ? { Authorization: `Bearer ${token}` } : {};
};
