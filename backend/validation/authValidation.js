import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3, "Username must be at least 3 characters").max(50),
    email: z.string().trim().email("Invalid email address").max(100),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().optional(),
  }),
});

export const verifyEmailSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Verification token is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters").max(72),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address"),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters").max(72),
  }),
});

// An empty <input type="number"> submits "" — coerced by z.coerce.number()
// that would become 0 and fail min(1), so blank must resolve to "not
// provided" rather than being coerced at all.
const optionalSemester = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().int().min(1).max(12).optional()
);

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(20).optional(),
    semester: optionalSemester,
    courseBranch: z.string().trim().max(100).optional(),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    emailNotificationsEnabled: z.boolean(),
  }),
});
