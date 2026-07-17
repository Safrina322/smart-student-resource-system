import { Navigate } from "react-router-dom";
import { isTokenExpired, parseJwtPayload } from "../utils/jwt.js";
import { useAuth } from "../hooks/useAuth.js";

// allowRoles restricts a logged-in student-side session (student/lecturer/
// moderator) to specific roles, e.g. allowRoles={["lecturer"]}. Omit it for
// routes any logged-in student-side role can reach.
function ProtectedRoute({ children, allowAdmin = false, allowRoles = null }) {
  const { logout } = useAuth();
  const userToken = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");

  if (userToken && !isTokenExpired(userToken)) {
    if (allowRoles) {
      const role = parseJwtPayload(userToken)?.role;
      if (!allowRoles.includes(role)) {
        return <Navigate to="/dashboard" />;
      }
    }
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
