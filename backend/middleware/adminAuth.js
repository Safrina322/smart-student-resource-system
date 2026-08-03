import jwt from "jsonwebtoken";
import { ADMIN_ACCESS_TOKEN_COOKIE } from "../utils/cookies.js";

// Must match the secret adminAuthService.js signs with.
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

const adminAuth = (req, res, next) => {
  const token = req.cookies?.[ADMIN_ACCESS_TOKEN_COOKIE];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default adminAuth;
