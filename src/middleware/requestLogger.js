const logger = require('../utils/logger');

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  // Skip all logging in development if ENABLE_REQUEST_LOGGING is false
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_REQUEST_LOGGING === 'false') {
    return next();
  }
  
  const start = Date.now();
  
  // Skip logging for static files, health checks, and Chrome DevTools
  if (req.url.startsWith('/static/') || 
      req.url === '/health' ||
      req.url.startsWith('/.well-known/') ||
      req.url === '/favicon.ico' ||
      req.url.startsWith('/css/') ||
      req.url.startsWith('/js/') ||
      req.url.startsWith('/images/') ||
      req.url.endsWith('.png') ||
      req.url.endsWith('.jpg') ||
      req.url.endsWith('.jpeg') ||
      req.url.endsWith('.gif') ||
      req.url.endsWith('.svg') ||
      req.url.endsWith('.ico') ||
      req.url.endsWith('.css') ||
      req.url.endsWith('.js') ||
      req.url === '/' ||
      req.url.startsWith('/docs')) {
    return next();
  }
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Only log if duration > 500ms, error status, or API endpoints
    const isImportantEndpoint = req.url.startsWith('/api/') || 
                               req.url.startsWith('/auth/');
    
    if (duration > 500 || res.statusCode >= 400 || isImportantEndpoint) {
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      logger[logLevel](`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')?.substring(0, 50)
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = { requestLogger };
