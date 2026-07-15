import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import * as userRepository from "../repositories/userRepository.js";

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

export const register = async ({ username, email, password }) => {
  const existing = await userRepository.findByUsername(username);
  if (existing) {
    throw new AppError("Username already taken", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await userRepository.createUser({ username, email, hashedPassword });
};

export const login = async ({ username, password }) => {
  const user = await userRepository.findByUsername(username);
  if (!user) {
    throw new AppError("Invalid username or password", 401);
  }

  let isMatch;
  if (user.password?.startsWith("$2")) {
    isMatch = await bcrypt.compare(password, user.password);
  } else {
    // Legacy plaintext row — verify against the raw value once, then
    // transparently upgrade it to a bcrypt hash so it never happens again.
    isMatch = password === user.password;
    if (isMatch) {
      const upgradedHash = await bcrypt.hash(password, 10);
      await userRepository.updatePassword(user.id, upgradedHash);
    }
  }

  if (!isMatch) {
    throw new AppError("Invalid username or password", 401);
  }

  const token = signToken(user);
  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
};
