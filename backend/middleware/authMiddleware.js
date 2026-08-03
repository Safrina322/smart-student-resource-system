import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_COOKIE } from "../utils/cookies.js";

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info
    next(); // allow request
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
