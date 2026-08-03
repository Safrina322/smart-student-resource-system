// Cookie names and shared options for the httpOnly-cookie auth model.
// Two independent, mutually-exclusive sessions can exist (student-side vs
// admin), each with its own access/refresh cookie pair, so logging into one
// doesn't accidentally read or clear the other's cookies.
export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const ADMIN_ACCESS_TOKEN_COOKIE = "admin_access_token";
export const ADMIN_REFRESH_TOKEN_COOKIE = "admin_refresh_token";
export const CSRF_COOKIE = "csrf_token";

export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

// Frontend and backend are different origins in both dev (5173 vs 5000) and
// production (Vercel vs Railway), so cookies need SameSite=None to be sent
// cross-site at all - but SameSite=None requires Secure, which local http
// dev doesn't have. The dev server proxies /api and /socket.io through Vite
// instead (see vite.config.js), making dev requests same-origin so
// SameSite=Lax works there without HTTPS.
const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const setSessionCookies = (
  res,
  { accessCookieName, refreshCookieName, accessToken, refreshToken, refreshMaxAgeMs }
) => {
  res.cookie(accessCookieName, accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
  res.cookie(refreshCookieName, refreshToken, {
    ...baseCookieOptions,
    maxAge: refreshMaxAgeMs,
  });
};

const ALL_COOKIE_NAMES = [
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
];

// Clears every session cookie (both student and admin), so logging in as
// one role always leaves a clean slate for the other - matching this app's
// existing "sessions are mutually exclusive" behavior.
export const clearAllSessionCookies = (res) => {
  ALL_COOKIE_NAMES.forEach((name) => res.clearCookie(name, baseCookieOptions));
};

export const cookieOptions = baseCookieOptions;
