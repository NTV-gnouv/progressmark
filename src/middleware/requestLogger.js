const logger = require('../utils/logger');

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Skip logging for static files and health checks
  if (req.url.startsWith('/static/') || req.url === '/health') {
    return next();
  }
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Only log if duration > 100ms or error status
    if (duration > 100 || res.statusCode >= 400) {
      logger.info(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')?.substring(0, 100)
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = { requestLogger };
