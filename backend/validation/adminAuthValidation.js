import { z } from "zod";

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address").max(100),
    password: z.string().min(1, "Password is required"),
  }),
});
