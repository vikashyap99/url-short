import { ApiError } from "../utils/ApiError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.slice(1).join("."),
        message: e.message,
      }));
      throw ApiError.badRequest("Validation failed", errors);
    }

    const { body, params, query } = result.data;
    if (body) req.body = body;
    if (params) req.params = params;
    if (query) req.query = query;

    next();
  };
}
