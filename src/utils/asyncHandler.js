const ErrorLogService = require('../services/errorLogService');


const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Log error to database
      ErrorLogService.logError(error, req, {
        service: 'api',
        operation: `${req.method} ${req.route?.path || req.path}`,
        severity: error.statusCode >= 500 ? 'high' : 'medium',
        statusCode: error.statusCode || 500,
        customData: {
          body: req.body,
          params: req.params,
          query: req.query
        }
      }).catch(console.error);
      
      // Pass to error handler middleware
      next(error);
    });
  };
};

module.exports = { asyncHandler };