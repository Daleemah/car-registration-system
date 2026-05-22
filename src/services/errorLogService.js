const ErrorLog = require('../models/errorLogModel');
const { v4: uuidv4 } = require('uuid');

class ErrorLogService {
  static async logError(error, req, options = {}) {
    try {
      const {
        service = 'general',
        operation = 'unknown',
        severity = 'medium',
        statusCode = 500,
        customData = {},
        tags = []
      } = options;

      const errorId = `${Date.now()}-${uuidv4().substring(0, 8)}`;
      
      // Sanitize sensitive data
      const sanitizeData = (data) => {
        if (!data) return data;
        const safeData = { ...data };
        const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'refreshToken'];
        sensitiveFields.forEach(field => {
          if (safeData[field]) safeData[field] = '[REDACTED]';
        });
        return safeData;
      };
      
      // Calculate duration if startTime exists
      let duration = null;
      if (req?.startTime) {
        duration = Date.now() - req.startTime;
      }
      
      const errorLog = new ErrorLog({
        errorId,
        errorName: error.name || 'UnknownError',
        errorMessage: error.message || String(error),
        errorStack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        request: req ? {
          method: req.method,
          url: req.originalUrl || req.url,
          path: req.path,
          query: sanitizeData(req.query),
          params: sanitizeData(req.params),
          body: sanitizeData(req.body),
          headers: {
            userAgent: req.get('user-agent'),
            referer: req.get('referer'),
            origin: req.get('origin')
          },
          ip: req.ip || req.connection?.remoteAddress,
          timestamp: new Date()
        } : undefined,
        user: req?.user ? {
          userId: req.user._id,
          email: req.user.email,
          role: req.user.role
        } : undefined,
        context: {
          service,
          operation,
          statusCode,
          severity
        },
        metadata: {
          duration,
          retryCount: 0,
          tags,
          customData: sanitizeData(customData)
        }
      });
      
      await errorLog.save();
      
      // Optional: Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ERROR LOGGED] ${errorId}: ${error.name} - ${error.message}`);
      }
      
      return errorLog;
    } catch (loggingError) {
      console.error('Failed to log error to database:', loggingError);
      return null;
    }
  }

  static setupUnhandledRejectionHandler() {
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      
      await this.logError(
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
      
      await this.logError(error, null, {
        service: 'system',
        operation: 'uncaughtException',
        severity: 'critical'
      }).catch(console.error);
      
      // Gracefully shutdown
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  }
}

module.exports = ErrorLogService;