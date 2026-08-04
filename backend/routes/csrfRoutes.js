import express from "express";
import { CSRF_COOKIE } from "../utils/cookies.js";

const router = express.Router();

// See middleware/csrf.js for why this exists: the frontend can't read the
// csrf_token cookie directly via document.cookie once frontend and backend
// are on different origins, so it fetches the value here instead - a plain
// GET, protected by this app's own CORS allowlist rather than by secrecy.
router.get("/", (req, res) => {
  res.json({ csrfToken: req.cookies?.[CSRF_COOKIE] || null });
});

export default router;
