import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Lets Zod schemas carry OpenAPI metadata (.openapi(...)); safe to call once,
// globally, before any schema is registered below.
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Two separate httpOnly-cookie schemes, matching the two separate token
// types the API actually issues (student-side vs admin-side - see
// ADMIN_JWT_SECRET) - a route documented as requiring "userAuth" genuinely
// rejects an admin token and vice versa, so this isn't just a display label.
// Swagger UI's "Try it out" sends these automatically (same-origin cookies
// set by a prior POST /login in the same browser session) - there's no
// "Authorize" token to paste in manually anymore.
registry.registerComponent("securitySchemes", "userAuth", {
  type: "apiKey",
  in: "cookie",
  name: "access_token",
  description: "Student/lecturer/moderator httpOnly session cookie from POST /api/auth/login",
});

registry.registerComponent("securitySchemes", "adminAuth", {
  type: "apiKey",
  in: "cookie",
  name: "admin_access_token",
  description: "Admin httpOnly session cookie from POST /api/admin/login",
});

const errorSchema = z.object({ message: z.string() });

const errorResponse = (description) => ({
  description,
  content: { "application/json": { schema: errorSchema } },
});

// Applied to every registered route - every controller in this codebase
// funnels errors through the same AppError + central error middleware, so
// these shapes are true for literally every endpoint, not per-route guesses.
const standardResponses = {
  400: errorResponse("Validation failed"),
  401: errorResponse("Missing, malformed, or expired token"),
  500: errorResponse("Internal server error"),
};

// Thin wrapper over registry.registerPath(): every route in this app already
// declares its request shape as one combined Zod schema
// (z.object({ body?, params?, query? })) via the `validate` middleware, so
// this pulls the three parts apart instead of every call site repeating that
// destructuring. Response bodies are intentionally left undocumented beyond
// "200 succeeded" - the codebase's Zod schemas validate requests, not
// responses, and fabricating response schemas that were never enforced
// would document a contract the API doesn't actually guarantee.
export const registerRoute = ({
  method,
  path,
  tags,
  summary,
  security,
  schema,
  successDescription = "Success",
  extraResponses = {},
}) => {
  const request = schema
    ? {
        ...(schema.shape.params ? { params: schema.shape.params } : {}),
        ...(schema.shape.query ? { query: schema.shape.query } : {}),
        ...(schema.shape.body
          ? { body: { content: { "application/json": { schema: schema.shape.body } } } }
          : {}),
      }
    : undefined;

  registry.registerPath({
    method,
    path,
    tags,
    summary,
    security,
    request,
    responses: {
      200: { description: successDescription },
      ...standardResponses,
      ...extraResponses,
    },
  });
};
