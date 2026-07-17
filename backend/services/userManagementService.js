import { AppError } from "../utils/AppError.js";
import * as userManagementRepository from "../repositories/userManagementRepository.js";
import { logAdminAction } from "../utils/auditLogger.js";

const VALID_ROLES = ["student", "lecturer", "moderator"];

export const listUsers = (filters) => userManagementRepository.findAll(filters);

export const changeRole = async (userId, role, adminId) => {
  if (!VALID_ROLES.includes(role)) {
    throw new AppError(`Role must be one of: ${VALID_ROLES.join(", ")}`, 400);
  }

  const user = await userManagementRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await userManagementRepository.updateRole(userId, role);

  logAdminAction({
    adminId,
    actionType: "user_role_changed",
    targetType: "user",
    targetId: Number(userId),
    details: `Changed ${user.username}'s role from ${user.role} to ${role}`,
  });

  return userManagementRepository.findById(userId);
};

export const changeStatus = async (userId, isActive, adminId) => {
  const user = await userManagementRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await userManagementRepository.updateStatus(userId, isActive);

  logAdminAction({
    adminId,
    actionType: isActive ? "user_activated" : "user_deactivated",
    targetType: "user",
    targetId: Number(userId),
    details: `${isActive ? "Activated" : "Deactivated"} ${user.username}`,
  });

  return userManagementRepository.findById(userId);
};
