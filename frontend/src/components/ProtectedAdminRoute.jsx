import { Navigate } from "react-router-dom";

function parseJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = parseJwtPayload(token);
  if (!payload) return true;
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    return <Navigate to="/admin/login" />;
  }

  return children;
}

export default ProtectedAdminRoute;
