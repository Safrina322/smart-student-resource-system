import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../repositories/adminRepository.js", () => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
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

process.env.JWT_SECRET ||= "test-secret";
process.env.ADMIN_JWT_SECRET ||= "test-admin-secret";

const adminRepository = await import("../repositories/adminRepository.js");
const refreshTokenRepository = await import("../repositories/refreshTokenRepository.js");
const { login, refreshSession, logoutAdmin, getAdminProfile } = await import(
  "../services/adminAuthService.js"
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("login", () => {
  it("rejects an unknown email without revealing whether the account exists", async () => {
    adminRepository.findByEmail.mockResolvedValue(null);

    await expect(login({ email: "ghost@example.com", password: "whatever" })).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid credentials",
    });
  });

  it("rejects a wrong password for an existing (bcrypt-hashed) admin", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    adminRepository.findByEmail.mockResolvedValue({
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "sysadmin",
      password: hashedPassword,
    });

    await expect(
      login({ email: "admin@example.com", password: "wrong-password" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("logs in successfully and returns a signed access token plus a stored refresh token", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    adminRepository.findByEmail.mockResolvedValue({
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "sysadmin",
      password: hashedPassword,
    });

    const result = await login({ email: "admin@example.com", password: "correct-password" });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.admin).toEqual({
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "sysadmin",
    });

    expect(refreshTokenRepository.create).toHaveBeenCalledTimes(1);
    const call = refreshTokenRepository.create.mock.calls[0][0];
    expect(call.accountType).toBe("admin");
    expect(call.accountId).toBe(1);
  });

  it("rejects login for an admin account currently locked out, even with the correct password", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    adminRepository.findByEmail.mockResolvedValue({
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "sysadmin",
      password: hashedPassword,
      failed_login_attempts: 0,
      lockout_until: new Date(Date.now() + 60 * 1000),
    });

    await expect(
      login({ email: "admin@example.com", password: "correct-password" })
    ).rejects.toMatchObject({ statusCode: 423 });
  });

  it("locks the admin account after the 5th consecutive failed attempt", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("correct-password", 10);
    adminRepository.findByEmail.mockResolvedValue({
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "sysadmin",
      password: hashedPassword,
      failed_login_attempts: 4,
      lockout_until: null,
    });

    await expect(
      login({ email: "admin@example.com", password: "wrong-password" })
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(adminRepository.recordFailedLogin).toHaveBeenCalledTimes(1);
    const [adminId, attempts, lockoutUntil] = adminRepository.recordFailedLogin.mock.calls[0];
    expect(adminId).toBe(1);
    expect(attempts).toBe(0);
    expect(lockoutUntil).toBeInstanceOf(Date);
  });
});

describe("refreshSession", () => {
  it("rejects when no refresh token is provided", async () => {
    await expect(refreshSession(undefined)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects a refresh token that belongs to a student account, not an admin", async () => {
    refreshTokenRepository.findValid.mockResolvedValue({
      account_type: "user",
      account_id: 1,
      token_hash: "hashed:raw-token",
      expires_at: new Date(Date.now() + 1000),
    });

    await expect(refreshSession("raw-token")).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rotates the refresh token and preserves the original absolute expiry", async () => {
    const originalExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    refreshTokenRepository.findValid.mockResolvedValue({
      account_type: "admin",
      account_id: 1,
      token_hash: "hashed:old-raw-token",
      expires_at: originalExpiry,
    });
    adminRepository.findById.mockResolvedValue({
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "sysadmin",
    });

    const result = await refreshSession("old-raw-token");

    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith("hashed:old-raw-token");
    expect(result.refreshToken).not.toBe("old-raw-token");
    expect(result.admin).toEqual({
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "sysadmin",
    });

    const createCall = refreshTokenRepository.create.mock.calls.at(-1)[0];
    expect(createCall.expiresAt).toBe(originalExpiry);
  });
});

describe("logoutAdmin", () => {
  it("revokes the refresh token when one is provided", async () => {
    await logoutAdmin("some-raw-token");
    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith("hashed:some-raw-token");
  });
});

describe("getAdminProfile", () => {
  it("throws a 404 when the admin no longer exists", async () => {
    adminRepository.findById.mockResolvedValue(null);
    await expect(getAdminProfile(999)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns the public admin shape", async () => {
    adminRepository.findById.mockResolvedValue({
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "sysadmin",
      password: "should-not-appear",
    });

    const profile = await getAdminProfile(1);
    expect(profile).toEqual({ id: 1, name: "Admin User", email: "admin@example.com", role: "sysadmin" });
  });
});
