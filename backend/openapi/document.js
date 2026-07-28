import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry.js";
// Side-effect import: populates the registry with every route before the
// document below is generated from it.
import "./paths/index.js";

const isProduction = process.env.NODE_ENV === "production";

export const generateOpenApiDocument = () =>
  new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: {
      title: "SmartStudent API",
      version: "1.0.0",
      description:
        "Generated from this codebase's actual Zod validation schemas - the " +
        "request shapes shown here are the same ones the `validate` " +
        "middleware enforces at runtime, not hand-maintained docs that can " +
        "drift from the code. Response bodies aren't schema-validated in " +
        "this codebase, so they're intentionally left undocumented beyond " +
        "status codes rather than guessed at.",
    },
    servers: [
      {
        url: isProduction
          ? process.env.PUBLIC_API_URL || "https://smart-student-resource-system-production.up.railway.app"
          : `http://localhost:${process.env.PORT || 5000}`,
      },
    ],
  });
