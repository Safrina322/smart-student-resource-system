import { z } from "zod";

export const resourceIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const quizQuerySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({
    count: z.coerce.number().int().min(3).max(10).optional(),
  }),
});

export const flashcardsQuerySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({
    count: z.coerce.number().int().min(3).max(15).optional(),
  }),
});

export const chatSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    message: z.string().trim().min(1, "Message cannot be empty").max(2000),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "model"]),
          text: z.string().max(4000),
        })
      )
      .max(20)
      .optional(),
  }),
});

export const studyPlanSchema = z.object({
  body: z.object({
    goal: z.string().trim().min(3, "Tell us what you're studying for").max(500),
    hoursPerWeek: z.coerce.number().int().min(1).max(60),
    targetWeeks: z.coerce.number().int().min(1).max(26),
  }),
});

export const searchAssistSchema = z.object({
  body: z.object({
    query: z.string().trim().min(2, "Query is too short").max(300),
  }),
});
