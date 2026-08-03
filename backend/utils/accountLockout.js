// Shared account-level brute-force protection for both student/lecturer/
// moderator logins (users table) and admin logins (admin table). IP-based
// rate limiting (see middleware/rateLimiter.js) doesn't stop a slow,
// distributed attack against one specific account from many IPs - this
// catches that by tracking failures per account instead of per IP.
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export const isLockedOut = (account) =>
  Boolean(account.lockout_until && new Date(account.lockout_until) > new Date());

// Called after a failed password check. Once attempts hit the threshold,
// locks the account and resets the counter so the next window starts clean
// after the lockout expires, rather than requiring ever-larger counts.
export const nextFailedAttemptState = (account) => {
  const attempts = (account.failed_login_attempts || 0) + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return { attempts: 0, lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) };
  }
  return { attempts, lockoutUntil: null };
};
