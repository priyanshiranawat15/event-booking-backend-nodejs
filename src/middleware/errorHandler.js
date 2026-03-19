const config = require('../config/config');

/**
 * Custom Error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, errorCode = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (error, req, res, next) => {
  let { statusCode = 500, message } = error;

  // Log error details
  console.error('Error occurred:', {
    message: error.message,
    statusCode: statusCode,
    stack: config.isDevelopment() ? error.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    if (error.code === 11000) {
      statusCode = 409;
      message = 'Duplicate entry found';
    } else {
      statusCode = 500;
      message = 'Database error occurred';
    }
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'External service unavailable';
  } else if (error.code === 'TIMEOUT') {
    statusCode = 408;
    message = 'Request timeout';
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: message,
      statusCode: statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };

  // Add error code if available
  if (error.errorCode) {
    errorResponse.error.code = error.errorCode;
  }

  // Add stack trace in development mode
  if (config.isDevelopment()) {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = {
      name: error.name,
      originalMessage: error.message
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new APIError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request validation error handler
 */
const validationErrorHandler = (validationResult) => {
  return (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          details: errorMessages,
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};

/**
 * Rate limit error handler
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      statusCode: 429,
      timestamp: new Date().toISOString(),
      retryAfter: req.rateLimit?.resetTime || '15 minutes'
    }
  });
};

/**
 * CORS error handler
 */
const corsErrorHandler = (req, res) => {
  res.status(403).json({
    success: false,
    error: {
      message: 'CORS policy violation',
      statusCode: 403,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Database connection error handler
 */
const dbErrorHandler = (error, req, res, next) => {
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    return res.status(503).json({
      success: false,
      error: {
        message: 'Database service temporarily unavailable',
        statusCode: 503,
        timestamp: new Date().toISOString()
      }
    });
  }

  next(error);
};

/**
 * External API error handler
 */
const externalAPIErrorHandler = (serviceName) => {
  return (error, req, res, next) => {
    if (error.message.includes(serviceName) || error.message.includes('API')) {
      const statusCode = error.response?.status || 503;

      return res.status(statusCode).json({
        success: false,
        error: {
          message: `${serviceName} service error`,
          statusCode: statusCode,
          timestamp: new Date().toISOString(),
          service: serviceName
        }
      });
    }

    next(error);
  };
};

/**
 * Graceful shutdown error handler
 */
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  // Close server
  if (global.server) {
    global.server.close((err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);

  // Log error details
  console.error('Stack trace:', error.stack);

  // Graceful shutdown
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);

  // Close server gracefully
  if (global.server) {
    global.server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = {
  APIError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validationErrorHandler,
  rateLimitHandler,
  corsErrorHandler,
  dbErrorHandler,
  externalAPIErrorHandler
};
