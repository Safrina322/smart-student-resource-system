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

function clearUserSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("user");
}

function clearAdminSession() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminName");
  localStorage.removeItem("adminEmail");
}

function ProtectedRoute({ children, allowAdmin = false }) {
  const userToken = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");

  if (userToken && !isTokenExpired(userToken)) {
    return children;
  }

  if (userToken && isTokenExpired(userToken)) {
    clearUserSession();
  }

  if (allowAdmin && adminToken && !isTokenExpired(adminToken)) {
    return children;
  }

  if (allowAdmin && adminToken && isTokenExpired(adminToken)) {
    clearAdminSession();
  }

  return <Navigate to={allowAdmin ? "/admin/login" : "/login"} />;
}

export default ProtectedRoute;
