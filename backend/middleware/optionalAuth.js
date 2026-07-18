import jwt from "jsonwebtoken";

// Like authMiddleware, but never rejects the request - decodes req.user if
// a valid Bearer token is present, otherwise leaves it undefined and moves
// on. For endpoints that are public but personalize when logged in (e.g.
// "average rating" for everyone, plus "your rating" if authenticated).
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Invalid/expired token on an optional-auth route: proceed as anonymous
    // rather than blocking the request.
  }

  next();
};

export default optionalAuth;
