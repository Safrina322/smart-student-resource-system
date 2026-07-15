import * as authService from "../services/authService.js";

export const register = async (req, res) => {
  await authService.register(req.body);
  res.json({ message: "User registered successfully" });
};

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ message: "Login successful", ...result });
};
