import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import PageLoader from "./PageLoader.jsx";

// allowRoles restricts a logged-in student-side session (student/lecturer/
// moderator) to specific roles, e.g. allowRoles={["lecturer"]}. Omit it for
// routes any logged-in student-side role can reach.
function ProtectedRoute({ children, allowAdmin = false, allowRoles = null }) {
  const { user, authLoading, isAuthenticated, isAdminAuthenticated } = useAuth();

  // Session state comes from an initial /me bootstrap call (httpOnly
  // cookies can't be read/checked client-side) - redirecting before that
  // resolves would bounce a genuinely logged-in user to the login page on
  // every page load.
  if (authLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    if (allowRoles && !allowRoles.includes(user?.role)) {
      return <Navigate to="/dashboard" />;
    }
    return children;
  }

  if (allowAdmin && isAdminAuthenticated) {
    return children;
  }

  return <Navigate to={allowAdmin ? "/admin/login" : "/login"} />;
}

export default ProtectedRoute;
