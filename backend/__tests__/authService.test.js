import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../repositories/userRepository.js", () => ({
  findByUsername: vi.fn(),
  findByEmail: vi.fn(),
  createUser: vi.fn(),
  updatePassword: vi.fn(),
}));
vi.mock("../utils/mailer.js", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

process.env.JWT_SECRET ||= "test-secret";

const userRepository = await import("../repositories/userRepository.js");
const { register, login, requestPasswordReset } = await import("../services/authService.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("register", () => {
  it("throws a 409 AppError when the username is already taken", async () => {
    userRepository.findByUsername.mockResolvedValue({ id: 1, username: "safrina" });

    await expect(
      register({ username: "safrina", email: "safrina@example.com", password: "password123" })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(userRepository.createUser).not.toHaveBeenCalled();
  });

  it("creates the user with a bcrypt hash, not the raw password", async () => {
    userRepository.findByUsername.mockResolvedValue(null);
    userRepository.createUser.mockResolvedValue(1);

    await register({ username: "newuser", email: "new@example.com", password: "password123" });

    expect(userRepository.createUser).toHaveBeenCalledTimes(1);
    const call = userRepository.createUser.mock.calls[0][0];
    expect(call.username).toBe("newuser");
    expect(call.hashedPassword).not.toBe("password123");
    expect(call.hashedPassword.startsWith("$2")).toBe(true);
  });
});

describe("login", () => {
  it("rejects an unknown username without revealing whether the account exists", async () => {
    userRepository.findByUsername.mockResolvedValue(null);

    await expect(login({ username: "ghost", password: "whatever" })).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid username or password",
    });
  });

  it("rejects a wrong password for an existing (bcrypt-hashed) user", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    userRepository.findByUsername.mockResolvedValue({
      id: 1,
      username: "safrina",
      role: "student",
      password: hashedPassword,
    });

    await expect(login({ username: "safrina", password: "wrong-password" })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("logs in successfully and returns a signed token for a correct password", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    userRepository.findByUsername.mockResolvedValue({
      id: 42,
      username: "safrina",
      role: "student",
      password: hashedPassword,
    });

    const result = await login({ username: "safrina", password: "correct-password" });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user).toEqual({ id: 42, username: "safrina", role: "student" });
  });

  it("transparently upgrades a legacy plaintext password to a bcrypt hash on successful login", async () => {
    userRepository.findByUsername.mockResolvedValue({
      id: 7,
      username: "legacyuser",
      role: "student",
      password: "plaintext-password",
    });

    await login({ username: "legacyuser", password: "plaintext-password" });

    expect(userRepository.updatePassword).toHaveBeenCalledTimes(1);
    const [userId, newHash] = userRepository.updatePassword.mock.calls[0];
    expect(userId).toBe(7);
    expect(newHash.startsWith("$2")).toBe(true);
  });
});

describe("requestPasswordReset", () => {
  it("resolves silently for an unregistered email (no account enumeration)", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(requestPasswordReset("nobody@example.com")).resolves.toBeUndefined();
  });
});
