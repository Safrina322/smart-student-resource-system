import crypto from "crypto";
import { CSRF_COOKIE, cookieOptions } from "../utils/cookies.js";

// Double-submit cookie CSRF protection. The token itself carries no secret
// server-side state - security comes from a cross-site attacker being able
// to trigger a request that carries the cookie automatically, but having no
// way to learn its value to also set the matching header.
//
// The frontend learns the value via GET /api/csrf-token's JSON body (see
// routes/csrfRoutes.js), NOT by reading the cookie directly with
// document.cookie - in production, frontend and backend are on different
// origins (Vercel/Railway), and document.cookie can only ever see cookies
// scoped to the page's OWN origin. A cookie set by a cross-origin API
// response is still stored and re-sent by the browser on the next request
// to that API (that part isn't origin-restricted), it's just invisible to
// that other origin's JS - which is exactly why a JSON response body,
// protected by this app's own CORS allowlist, is the channel that works
// here instead. (This never surfaced locally, where the Vite dev proxy
// makes everything same-origin, so document.cookie could read it fine.)
const CSRF_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Runs on every request (before the check below) so the cookie exists from
// a user's very first page load, including the login/register POST itself.
export const ensureCsrfCookie = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      ...cookieOptions,
      httpOnly: true,
      maxAge: CSRF_TOKEN_MAX_AGE_MS,
    });
    req.cookies[CSRF_COOKIE] = token;
  }
  next();
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "Invalid or missing CSRF token" });
  }

  next();
};
