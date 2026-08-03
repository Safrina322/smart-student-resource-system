import axios from "axios";

// In dev, requests go through Vite's proxy (vite.config.js) so the browser
// sees everything as same-origin, letting the httpOnly session cookies work
// without HTTPS. Production is genuinely cross-origin (Vercel + Railway),
// so it needs the absolute backend URL.
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? "" : import.meta.env.VITE_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

// Double-submit CSRF: the cookie is httpOnly-free by design so this can
// read it and echo it back as a header - a cross-site attacker can trigger
// the cookie to be sent automatically, but can't read its value to also set
// the matching header.
apiClient.interceptors.request.use((config) => {
  if (MUTATING_METHODS.has((config.method || "").toLowerCase())) {
    const csrfToken = readCookie("csrf_token");
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }
  return config;
});

// Tracks which session (if any) is currently active, so a 401 knows which
// refresh endpoint to try - student and admin sessions use separate cookie
// pairs and separate refresh endpoints. Set by AuthContext on login/logout
// and on the initial /me bootstrap.
let activeSessionType = null;
export const setActiveSessionType = (type) => {
  activeSessionType = type; // "user" | "admin" | null
};

const REFRESH_PATH = {
  user: "/api/auth/refresh",
  admin: "/api/admin/refresh",
};

const isAuthLifecycleEndpoint = (url = "") =>
  url.includes("/login") || url.includes("/refresh") || url.includes("/logout");

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const refreshPath = activeSessionType && REFRESH_PATH[activeSessionType];

    if (
      status === 401 &&
      refreshPath &&
      originalRequest &&
      !originalRequest._retried &&
      !isAuthLifecycleEndpoint(originalRequest.url)
    ) {
      originalRequest._retried = true;
      try {
        const csrfToken = readCookie("csrf_token");
        await axios.post(
          `${API_BASE_URL}${refreshPath}`,
          {},
          { withCredentials: true, headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }
        );
        return apiClient(originalRequest);
      } catch {
        // Refresh failed too - fall through to the normal error path below,
        // which surfaces the original 401 to the caller.
      }
    }

    const message =
      error.response?.data?.message || error.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export const getApiUrl = () => API_BASE_URL;

export default apiClient;
