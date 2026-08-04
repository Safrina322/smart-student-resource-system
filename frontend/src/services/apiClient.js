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

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

// Double-submit CSRF: the backend can't be trusted to accept a mutating
// request unless the caller also proves it can see the matching token
// value. In production frontend and backend are on different origins
// (Vercel/Railway), so document.cookie can't read the csrf_token cookie
// directly - it's scoped to the backend's origin, not this page's. Fetching
// it from GET /api/csrf-token's JSON body instead works because that
// response is protected by the backend's own CORS allowlist, same as the
// cookie would otherwise be protected by same-origin - a forged cross-site
// request can trigger the cookie to be sent automatically, but can't read
// this response to learn the value to echo back as a header.
let csrfToken = null;
let csrfTokenPromise = null;

const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (!csrfTokenPromise) {
    csrfTokenPromise = axios
      .get(`${API_BASE_URL}/api/csrf-token`, { withCredentials: true })
      .then(({ data }) => {
        csrfToken = data.csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }
  return csrfTokenPromise;
};

apiClient.interceptors.request.use(async (config) => {
  if (MUTATING_METHODS.has((config.method || "").toLowerCase())) {
    const token = await getCsrfToken();
    if (token) {
      config.headers["X-CSRF-Token"] = token;
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
        const token = await getCsrfToken();
        await axios.post(
          `${API_BASE_URL}${refreshPath}`,
          {},
          { withCredentials: true, headers: token ? { "X-CSRF-Token": token } : {} }
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
