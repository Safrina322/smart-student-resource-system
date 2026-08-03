import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../repositories/userRepository.js", () => ({
  findByUsername: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  createUser: vi.fn(),
  updatePassword: vi.fn(),
  recordFailedLogin: vi.fn(),
  resetLoginAttempts: vi.fn(),
}));
vi.mock("../repositories/refreshTokenRepository.js", () => ({
  hashToken: vi.fn((raw) => `hashed:${raw}`),
  create: vi.fn(),
  findValid: vi.fn(),
  revoke: vi.fn(),
  revokeAllForAccount: vi.fn(),
}));
vi.mock("../utils/mailer.js", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

process.env.JWT_SECRET ||= "test-secret";

const userRepository = await import("../repositories/userRepository.js");
const refreshTokenRepository = await import("../repositories/refreshTokenRepository.js");
const { register, login, refreshSession, logoutUser, requestPasswordReset } = await import(
  "../services/authService.js"
);

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

  it("logs in successfully and returns a signed access token plus a stored refresh token", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    userRepository.findByUsername.mockResolvedValue({
      id: 42,
      username: "safrina",
      role: "student",
      password: hashedPassword,
    });

    const result = await login({ username: "safrina", password: "correct-password" });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user).toEqual({ id: 42, username: "safrina", role: "student" });

    expect(refreshTokenRepository.create).toHaveBeenCalledTimes(1);
    const call = refreshTokenRepository.create.mock.calls[0][0];
    expect(call.accountType).toBe("user");
    expect(call.accountId).toBe(42);
    expect(call.tokenHash).toBe(`hashed:${result.refreshToken}`);
  });

  it("issues a 30-day refresh window when rememberMe is set, 7 days otherwise", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    userRepository.findByUsername.mockResolvedValue({
      id: 42,
      username: "safrina",
      role: "student",
      password: hashedPassword,
    });

    const withoutRememberMe = await login({ username: "safrina", password: "correct-password" });
    const withRememberMe = await login({
      username: "safrina",
      password: "correct-password",
      rememberMe: true,
    });

    expect(withRememberMe.refreshMaxAgeMs).toBeGreaterThan(withoutRememberMe.refreshMaxAgeMs);
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

  it("rejects login for an account currently locked out, even with the correct password", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    userRepository.findByUsername.mockResolvedValue({
      id: 1,
      username: "safrina",
      role: "student",
      password: hashedPassword,
      failed_login_attempts: 0,
      lockout_until: new Date(Date.now() + 60 * 1000),
    });

    await expect(login({ username: "safrina", password: "correct-password" })).rejects.toMatchObject({
      statusCode: 423,
    });
  });

  it("locks the account after the 5th consecutive failed attempt", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    userRepository.findByUsername.mockResolvedValue({
      id: 1,
      username: "safrina",
      role: "student",
      password: hashedPassword,
      failed_login_attempts: 4,
      lockout_until: null,
    });

    await expect(login({ username: "safrina", password: "wrong-password" })).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(userRepository.recordFailedLogin).toHaveBeenCalledTimes(1);
    const [userId, attempts, lockoutUntil] = userRepository.recordFailedLogin.mock.calls[0];
    expect(userId).toBe(1);
    expect(attempts).toBe(0);
    expect(lockoutUntil).toBeInstanceOf(Date);
    expect(lockoutUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it("resets the failed-attempt counter on a successful login", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    userRepository.findByUsername.mockResolvedValue({
      id: 1,
      username: "safrina",
      role: "student",
      password: hashedPassword,
      failed_login_attempts: 3,
      lockout_until: null,
    });

    await login({ username: "safrina", password: "correct-password" });

    expect(userRepository.resetLoginAttempts).toHaveBeenCalledWith(1);
  });
});

describe("refreshSession", () => {
  it("rejects when no refresh token is provided", async () => {
    await expect(refreshSession(undefined)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects an unknown, expired, or already-revoked refresh token", async () => {
    refreshTokenRepository.findValid.mockResolvedValue(null);

    await expect(refreshSession("some-raw-token")).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rotates the refresh token: revokes the old one and issues a new access + refresh token", async () => {
    const originalExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    refreshTokenRepository.findValid.mockResolvedValue({
      account_type: "user",
      account_id: 42,
      token_hash: "hashed:old-raw-token",
      expires_at: originalExpiry,
    });
    userRepository.findById.mockResolvedValue({ id: 42, username: "safrina", role: "student" });

    const result = await refreshSession("old-raw-token");

    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith("hashed:old-raw-token");
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toBe("old-raw-token");
    expect(result.user).toEqual({ id: 42, username: "safrina", role: "student" });

    // Preserves the ORIGINAL absolute expiry rather than resetting a fresh
    // full-length window on every refresh.
    const createCall = refreshTokenRepository.create.mock.calls.at(-1)[0];
    expect(createCall.expiresAt).toBe(originalExpiry);
  });

  it("rejects if the account behind a valid refresh token no longer exists", async () => {
    refreshTokenRepository.findValid.mockResolvedValue({
      account_type: "user",
      account_id: 999,
      token_hash: "hashed:raw-token",
      expires_at: new Date(Date.now() + 1000),
    });
    userRepository.findById.mockResolvedValue(null);

    await expect(refreshSession("raw-token")).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("logoutUser", () => {
  it("revokes the refresh token when one is provided", async () => {
    await logoutUser("some-raw-token");
    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith("hashed:some-raw-token");
  });

  it("does nothing when no refresh token is provided", async () => {
    await logoutUser(undefined);
    expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
  });
});

describe("requestPasswordReset", () => {
  it("resolves silently for an unregistered email (no account enumeration)", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(requestPasswordReset("nobody@example.com")).resolves.toBeUndefined();
  });
});
