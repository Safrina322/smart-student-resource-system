import { registerRoute } from "../registry.js";
import { searchQuerySchema, popularSearchQuerySchema } from "../../validation/searchValidation.js";

const tags = ["Search"];

registerRoute({
  method: "get",
  path: "/api/search",
  tags,
  summary: "Global search across courses and approved lecturer resources (public)",
  security: [],
  schema: searchQuerySchema,
});

registerRoute({
  method: "get",
  path: "/api/search/popular",
  tags,
  summary: "Most frequent search queries in the last 30 days",
  security: [],
  schema: popularSearchQuerySchema,
});
