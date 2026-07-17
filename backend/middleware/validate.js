// Generic request-validation middleware factory. Pass a zod schema shaped
// like { body?, params?, query? } and it validates + replaces req.<part>
// with the parsed (coerced/defaulted) result before the route handler runs.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.slice(1).join("."),
        message: issue.message,
      })),
    });
  }

  if (result.data.body) req.body = result.data.body;
  if (result.data.query) req.query = result.data.query;
  if (result.data.params) req.params = result.data.params;

  next();
};

export default validate;
