// Integration tests: exercise authService against a REAL MySQL database
// (see scripts/setupTestDb.js), not mocked repositories. These catch things
// the mocked unit tests in __tests__/authService.test.js structurally
// cannot - actual SQL behavior (ENUM constraints, DATETIME comparisons in
// "expires_at > NOW()", hashed-vs-raw storage) and cross-call state that
// really persists in a table rather than a vi.fn() mock's return value.
//
// Run via `npm run test:integration` (sets up/migrates the test database
// first) - NOT part of the default `npm test`, which stays fast and
// DB-free for everyday iteration.
import { describe, it, expect, afterAll } from "vitest";
import bcrypt from "bcryptjs";

process.env.DB_NAME = process.env.TEST_DB_NAME || "smartstudent_test";
process.env.JWT_SECRET ||= "integration-test-secret";

const db = (await import("../../db.js")).default;
const { queryAsync } = await import("../../db.js");
const userRepository = await import("../../repositories/userRepository.js");
const refreshTokenRepository = await import("../../repositories/refreshTokenRepository.js");
const authService = await import("../../services/authService.js");

const uniqueSuffix = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createTestUser = async ({ password = "correct-password" } = {}) => {
  const suffix = uniqueSuffix();
  const username = `it_user_${suffix}`;
  const email = `${username}@example.com`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const insertId = await userRepository.createUser({
    username,
    email,
    hashedPassword,
    verificationToken: `token_${suffix}`,
  });
  await queryAsync("UPDATE users SET email_verified = 1 WHERE id = ?", [insertId]);
  return { id: insertId, username, email, password };
};

afterAll(async () => {
  await new Promise((resolve) => db.end(resolve));
});

describe("authService against a real database", () => {
  it("creates a real row and allows logging in with the correct password", async () => {
    const { username, password } = await createTestUser();

    const result = await authService.login({ username, password });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user.username).toBe(username);
  });

  it("records a failed attempt in the real users row on a wrong password", async () => {
    const { username, id } = await createTestUser();

    await expect(authService.login({ username, password: "wrong-password" })).rejects.toMatchObject({
      statusCode: 401,
    });

    const [row] = await queryAsync("SELECT failed_login_attempts FROM users WHERE id = ?", [id]);
    expect(row.failed_login_attempts).toBe(1);
  });

  it("locks the account in the database after 5 failed attempts, rejecting even the correct password", async () => {
    const { username, password, id } = await createTestUser();

    for (let i = 0; i < 5; i += 1) {
      await expect(
        authService.login({ username, password: "wrong-password" })
      ).rejects.toMatchObject({ statusCode: 401 });
    }

    const [row] = await queryAsync(
      "SELECT failed_login_attempts, lockout_until FROM users WHERE id = ?",
      [id]
    );
    expect(row.failed_login_attempts).toBe(0);
    expect(row.lockout_until).not.toBeNull();

    await expect(authService.login({ username, password })).rejects.toMatchObject({
      statusCode: 423,
    });
  });

  it("resets failed_login_attempts in the database on a successful login", async () => {
    const { username, password, id } = await createTestUser();

    await expect(authService.login({ username, password: "wrong-password" })).rejects.toMatchObject({
      statusCode: 401,
    });
    await authService.login({ username, password });

    const [row] = await queryAsync("SELECT failed_login_attempts FROM users WHERE id = ?", [id]);
    expect(row.failed_login_attempts).toBe(0);
  });

  it("stores the refresh token hashed (not raw), and rotation revokes the old row and preserves absolute expiry", async () => {
    const { username, password } = await createTestUser();
    const { refreshToken } = await authService.login({ username, password });

    const hash = refreshTokenRepository.hashToken(refreshToken);
    const [originalRow] = await queryAsync(
      "SELECT token_hash, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?",
      [hash]
    );
    expect(originalRow).toBeTruthy();
    expect(originalRow.revoked_at).toBeNull();

    const refreshed = await authService.refreshSession(refreshToken);
    expect(refreshed.refreshToken).not.toBe(refreshToken);

    const [revokedRow] = await queryAsync(
      "SELECT revoked_at FROM refresh_tokens WHERE token_hash = ?",
      [hash]
    );
    expect(revokedRow.revoked_at).not.toBeNull();

    const newHash = refreshTokenRepository.hashToken(refreshed.refreshToken);
    const [newRow] = await queryAsync(
      "SELECT expires_at FROM refresh_tokens WHERE token_hash = ?",
      [newHash]
    );
    expect(new Date(newRow.expires_at).getTime()).toBe(new Date(originalRow.expires_at).getTime());
  });

  it("rejects replaying a refresh token that was already rotated away", async () => {
    const { username, password } = await createTestUser();
    const { refreshToken } = await authService.login({ username, password });

    await authService.refreshSession(refreshToken);

    await expect(authService.refreshSession(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("revokes the refresh token row in the database on logout", async () => {
    const { username, password } = await createTestUser();
    const { refreshToken } = await authService.login({ username, password });

    await authService.logoutUser(refreshToken);

    const hash = refreshTokenRepository.hashToken(refreshToken);
    const [row] = await queryAsync("SELECT revoked_at FROM refresh_tokens WHERE token_hash = ?", [hash]);
    expect(row.revoked_at).not.toBeNull();
    await expect(authService.refreshSession(refreshToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("revokes every outstanding refresh token for the account when the password changes", async () => {
    const { id, username, password } = await createTestUser();
    const session1 = await authService.login({ username, password });
    const session2 = await authService.login({ username, password });

    await authService.changePassword({
      userId: id,
      currentPassword: password,
      newPassword: "new-correct-password",
    });

    await expect(authService.refreshSession(session1.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
    });
    await expect(authService.refreshSession(session2.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
