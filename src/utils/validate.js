const { ApiError } = require("./ApiError");

const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new ApiError(400, "Validation error", result.error.flatten()));
    }
    req.body = result.data;
    return next();
  };
}

module.exports = { validateBody };