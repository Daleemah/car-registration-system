const { ApiError } = require("../utils/ApiError");


function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation error";
    details = Object.values(err.errors).map((e) => e.message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value for '${field}'`;
  }

  // JWT errors (in case they bubble up outside auth middleware)
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  if (err.details) details = err.details;

  const payload = {
    success: false,
    requestId: req.requestId || undefined,
    message,
  };

  if (details) payload.details = details;

  // Only expose stack in non-production environments
  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  // Log server-side errors
  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error({
      requestId: req.requestId,
      error: message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };
