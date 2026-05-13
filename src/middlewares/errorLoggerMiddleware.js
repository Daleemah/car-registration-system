const ErrorLogService = require('../services/errorLogService');

/**
 * Error logging middleware - logs errors to database
 * Place this BEFORE your error handler
 */
const errorLogger = async (err, req, res, next) => {
  // Calculate duration if request timer was used
  const duration = req.startTime ? Date.now() - req.startTime : undefined;
  
  // Determine severity based on status code
  let severity = 'medium';
  const statusCode = err.statusCode || err.status || 500;
  
  if (statusCode >= 500) severity = 'high';
  else if (statusCode >= 400 && statusCode < 500) severity = 'medium';
  else if (statusCode < 400) severity = 'low';
  
  // Log error to database (don't await to avoid blocking)
  ErrorLogService.logError(err, req, {
    service: req.baseUrl?.split('/')[1] || 'api',
    operation: `${req.method} ${req.route?.path || req.path}`,
    severity,
    statusCode,
    duration,
    customData: {
      body: req.body,
      params: req.params,
      query: req.query
    }
  }).catch(console.error);
  
  // Pass to error handler
  next(err);
};

/**
 * Middleware to track request start time
 */
const requestTimer = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

/**
 * Setup handlers for unhandled rejections and exceptions
 */
const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    await ErrorLogService.logError(
      new Error(reason?.message || String(reason)),
      null,
      {
        service: 'system',
        operation: 'unhandledRejection',
        severity: 'critical',
        customData: { reason: String(reason) }
      }
    ).catch(console.error);
  });
  
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    
    await ErrorLogService.logError(error, null, {
      service: 'system',
      operation: 'uncaughtException',
      severity: 'critical'
    }).catch(console.error);
    
    // Gracefully shutdown
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};

module.exports = { errorLogger, requestTimer, setupUnhandledRejectionHandler };