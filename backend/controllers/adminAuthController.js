import * as adminAuthService from "../services/adminAuthService.js";

export const login = async (req, res) => {
  const result = await adminAuthService.login(req.body);
  res.json(result);
};
