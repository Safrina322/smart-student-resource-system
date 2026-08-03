import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import PageLoader from "./PageLoader.jsx";

function ProtectedAdminRoute({ children }) {
  const { authLoading, isAdminAuthenticated } = useAuth();

  if (authLoading) {
    return <PageLoader />;
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" />;
  }

  return children;
}

export default ProtectedAdminRoute;
