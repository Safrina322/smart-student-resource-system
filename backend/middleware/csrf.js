import crypto from "crypto";
import { CSRF_COOKIE, cookieOptions } from "../utils/cookies.js";

// Double-submit cookie CSRF protection. The token itself carries no secret
// server-side state - security comes from a cross-site attacker being able
// to trigger a request that carries the cookie automatically, but having no
// way to read the cookie's value to also set the matching header.
const CSRF_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Runs on every request (before the check below) so the cookie exists from
// a user's very first page load, including the login/register POST itself.
export const ensureCsrfCookie = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      ...cookieOptions,
      httpOnly: false, // must be readable by frontend JS to echo back as a header
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
