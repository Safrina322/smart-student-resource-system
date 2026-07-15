import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import * as adminRepository from "../repositories/adminRepository.js";

// `role: "admin"` stays a fixed generic tier for backward compatibility
// with adminAuth.js and anything else already checking for it;
// `adminRole` carries the granular dept_admin/sysadmin distinction for
// the new requireRole middleware.
const signToken = (admin) =>
  jwt.sign(
    { adminId: admin.id, role: "admin", adminRole: admin.role || "sysadmin" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

export const login = async ({ email, password }) => {
  const admin = await adminRepository.findByEmail(email);
  if (!admin) {
    throw new AppError("Invalid credentials", 401);
  }

  let isMatch;
  if (admin.password?.startsWith("$2")) {
    isMatch = await bcrypt.compare(password, admin.password);
  } else {
    // Legacy plaintext row — verify once, then upgrade to a bcrypt hash so
    // the admin password is never stored or compared in cleartext again.
    isMatch = password === admin.password;
    if (isMatch) {
      const upgradedHash = await bcrypt.hash(password, 10);
      await adminRepository.updatePassword(admin.id, upgradedHash);
    }
  }

  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = signToken(admin);
  return {
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role || "sysadmin" },
  };
};
