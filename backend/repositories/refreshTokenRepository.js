import crypto from "crypto";
import { queryAsync } from "../db.js";

// Refresh tokens are stored hashed (not raw) so a database leak doesn't
// directly hand out valid long-lived credentials - these are far more
// valuable to an attacker than the short-lived access token.
export const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

export const create = async ({ accountType, accountId, tokenHash, expiresAt }) => {
  await queryAsync(
    "INSERT INTO refresh_tokens (account_type, account_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    [accountType, accountId, tokenHash, expiresAt]
  );
};

export const findValid = async (tokenHash) => {
  const rows = await queryAsync(
    "SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()",
    [tokenHash]
  );
  return rows[0] || null;
};

export const revoke = async (tokenHash) => {
  await queryAsync("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?", [tokenHash]);
};

// Used on password change / suspicious activity to kill every other
// session for the account, not just the one making the current request.
export const revokeAllForAccount = async (accountType, accountId) => {
  await queryAsync(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE account_type = ? AND account_id = ? AND revoked_at IS NULL",
    [accountType, accountId]
  );
};
