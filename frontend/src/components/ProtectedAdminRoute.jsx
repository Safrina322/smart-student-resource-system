import { Navigate } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin/login" />;
}

export default ProtectedAdminRoute;
