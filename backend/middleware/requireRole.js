import { AppError } from "../utils/AppError.js";

// Run after authMiddleware (sets req.user from a student-side token) or
// adminAuth (sets req.admin from an admin-side token). Checks the granular
// role: req.admin.adminRole (dept_admin/sysadmin) or req.user.role
// (student/lecturer/moderator).
const requireRole = (...allowedRoles) => (req, res, next) => {
  const actualRole = req.admin?.adminRole || req.user?.role;

  if (!actualRole || !allowedRoles.includes(actualRole)) {
    return next(new AppError("Forbidden: insufficient role", 403));
  }

  next();
};

export default requireRole;
