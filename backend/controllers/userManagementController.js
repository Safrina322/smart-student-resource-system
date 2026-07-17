import * as userManagementService from "../services/userManagementService.js";

export const listUsers = async (req, res) => {
  const users = await userManagementService.listUsers(req.query);
  res.json(users);
};

export const changeRole = async (req, res) => {
  const user = await userManagementService.changeRole(
    req.params.id,
    req.body.role,
    req.admin?.adminId || null
  );
  res.json({ message: "Role updated", user });
};

export const changeStatus = async (req, res) => {
  const user = await userManagementService.changeStatus(
    req.params.id,
    req.body.isActive,
    req.admin?.adminId || null
  );
  res.json({ message: "Status updated", user });
};
