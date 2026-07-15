import { Navigate } from "react-router-dom";
import { isTokenExpired } from "../utils/jwt.js";
import { useAuth } from "../hooks/useAuth.js";

function ProtectedAdminRoute({ children }) {
  const { logout } = useAuth();
  const token = localStorage.getItem("adminToken");

  if (!token || isTokenExpired(token)) {
    logout();
    return <Navigate to="/admin/login" />;
  }

  return children;
}

export default ProtectedAdminRoute;
