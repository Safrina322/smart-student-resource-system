import { Navigate } from "react-router-dom";
import { isTokenExpired } from "../utils/jwt.js";
import { useAuth } from "../hooks/useAuth.js";

function ProtectedRoute({ children, allowAdmin = false }) {
  const { logout } = useAuth();
  const userToken = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");

  if (userToken && !isTokenExpired(userToken)) {
    return children;
  }

  if (allowAdmin && adminToken && !isTokenExpired(adminToken)) {
    return children;
  }

  const hasExpiredToken =
    (userToken && isTokenExpired(userToken)) || (allowAdmin && adminToken && isTokenExpired(adminToken));

  if (hasExpiredToken) {
    logout();
  }

  return <Navigate to={allowAdmin ? "/admin/login" : "/login"} />;
}

export default ProtectedRoute;
