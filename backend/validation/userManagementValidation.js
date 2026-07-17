import { z } from "zod";

export const listUsersQuerySchema = z.object({
  query: z.object({
    role: z.enum(["student", "lecturer", "moderator"]).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    search: z.string().trim().max(100).optional(),
  }),
});

export const changeRoleSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    role: z.enum(["student", "lecturer", "moderator"]),
  }),
});

export const changeStatusSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});
