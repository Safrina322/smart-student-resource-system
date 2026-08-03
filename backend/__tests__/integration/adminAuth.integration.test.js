// Integration tests: exercise adminAuthService against a REAL MySQL
// database. See auth.integration.test.js for why these exist alongside the
// mocked unit tests, and scripts/setupTestDb.js for how the test database
// gets created and migrated.
import { describe, it, expect, afterAll } from "vitest";
import bcrypt from "bcryptjs";

process.env.DB_NAME = process.env.TEST_DB_NAME || "smartstudent_test";
process.env.JWT_SECRET ||= "integration-test-secret";
process.env.ADMIN_JWT_SECRET ||= "integration-test-admin-secret";

const db = (await import("../../db.js")).default;
const { queryAsync } = await import("../../db.js");
const refreshTokenRepository = await import("../../repositories/refreshTokenRepository.js");
const adminAuthService = await import("../../services/adminAuthService.js");

const uniqueSuffix = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// adminRepository has no "create" helper (admin accounts are normally
// seeded once via raw SQL in index.js) - inserting directly here rather
// than adding a repository function that only tests would ever call.
const createTestAdmin = async ({ password = "correct-password" } = {}) => {
  const suffix = uniqueSuffix();
  const email = `it_admin_${suffix}@example.com`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await queryAsync(
    "INSERT INTO admin (name, email, password, role) VALUES (?, ?, ?, ?)",
    ["Integration Test Admin", email, hashedPassword, "sysadmin"]
  );
  return { id: result.insertId, email, password };
};

afterAll(async () => {
  await new Promise((resolve) => db.end(resolve));
});

describe("adminAuthService against a real database", () => {
  it("creates a real admin row and allows logging in with the correct password", async () => {
    const { email, password } = await createTestAdmin();

    const result = await adminAuthService.login({ email, password });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.admin.email).toBe(email);
  });

  it("locks the admin account in the database after 5 failed attempts", async () => {
    const { email, password, id } = await createTestAdmin();

    for (let i = 0; i < 5; i += 1) {
      await expect(
        adminAuthService.login({ email, password: "wrong-password" })
      ).rejects.toMatchObject({ statusCode: 401 });
    }

    const [row] = await queryAsync(
      "SELECT failed_login_attempts, lockout_until FROM admin WHERE id = ?",
      [id]
    );
    expect(row.failed_login_attempts).toBe(0);
    expect(row.lockout_until).not.toBeNull();

    await expect(adminAuthService.login({ email, password })).rejects.toMatchObject({
      statusCode: 423,
    });
  });

  it("rotates the refresh token in the database and rejects a replayed one", async () => {
    const { email, password } = await createTestAdmin();
    const { refreshToken } = await adminAuthService.login({ email, password });

    const refreshed = await adminAuthService.refreshSession(refreshToken);
    expect(refreshed.refreshToken).not.toBe(refreshToken);

    await expect(adminAuthService.refreshSession(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("does not let a student-side refresh token be used to refresh an admin session", async () => {
    // account_id collisions between the users and admin tables are
    // expected (both auto-increment from 1) - account_type must be what
    // actually disambiguates them, not just the numeric id.
    const { email, password, id } = await createTestAdmin();
    const { refreshToken } = await adminAuthService.login({ email, password });

    await queryAsync(
      "UPDATE refresh_tokens SET account_type = 'user' WHERE account_type = 'admin' AND account_id = ?",
      [id]
    );

    await expect(adminAuthService.refreshSession(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("revokes the refresh token row in the database on logout", async () => {
    const { email, password } = await createTestAdmin();
    const { refreshToken } = await adminAuthService.login({ email, password });

    await adminAuthService.logoutAdmin(refreshToken);

    const hash = refreshTokenRepository.hashToken(refreshToken);
    const [row] = await queryAsync("SELECT revoked_at FROM refresh_tokens WHERE token_hash = ?", [hash]);
    expect(row.revoked_at).not.toBeNull();
  });
});
