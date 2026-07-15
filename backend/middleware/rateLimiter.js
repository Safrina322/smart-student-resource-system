import rateLimit from "express-rate-limit";

// Login/register are the brute-force surface; cap attempts per IP instead of
// leaving them unlimited like the rest of the API.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});
