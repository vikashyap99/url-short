import { ApiError } from "../utils/ApiError.js";
import { config } from "../config/index.js";

export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors.length > 0 ? err.errors : undefined,
      ...(config.isDev && { stack: err.stack }),
    });
  }

  if (err.name === "ZodError") {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      error: err.message,
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate key error",
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: config.isDev ? err.message : "Internal server error",
    ...(config.isDev && { stack: err.stack }),
  });
}

export function notFoundHandler(req, res) {
  if (req.accepts("html") && !req.originalUrl.startsWith("/api/")) {
    return res.status(404).render("index", { error: `Page not found` });
  }
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
