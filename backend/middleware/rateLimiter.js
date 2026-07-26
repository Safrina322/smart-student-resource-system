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

// Every /api/ai/* route (other than search-assist, see aiPublicLimiter)
// spends real Gemini API quota per call. Summary/quiz/flashcards are cached
// per resource after the first generation, but chat and the study planner
// are not, so an authenticated-but-unlimited endpoint is still a real
// cost-abuse surface, not just a brute-force one.
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI requests. Please try again in a few minutes." },
});

// search-assist is intentionally public (same access model as /api/search),
// but unlike plain search it calls Gemini on every request with no caching,
// so it needs a tighter, IP-based cap than authenticated AI routes get -
// there's no logged-in user to hold accountable for abuse here.
export const aiPublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI requests. Please try again in a few minutes." },
});
