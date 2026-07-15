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
  }),
});
