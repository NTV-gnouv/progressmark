const logger = require('../utils/logger');
const { error } = require('../utils/response');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.id
  });

  // Database errors
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        return error.conflict(res, 'Resource already exists', {
          field: err.sqlMessage?.split("'")[1],
          constraint: 'unique'
        });
      
      case 'ER_NO_REFERENCED_ROW_2':
        return error.badRequest(res, 'Foreign key constraint failed');
      
      case 'ER_BAD_FIELD_ERROR':
        return error.badRequest(res, 'Invalid field reference');
      
      default:
        logger.error('Database error:', err);
        return error.internal(res, 'Database operation failed');
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error.unauthorized(res, 'Invalid token');
  }
  
  if (err.name === 'TokenExpiredError') {
    return error.unauthorized(res, 'Token expired');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return error.badRequest(res, 'Validation failed', err.details);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return error.badRequest(res, 'File too large');
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return error.badRequest(res, 'Too many files');
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return error.badRequest(res, 'Unexpected file field');
  }

  // Default error
  return error.internal(res, 'Internal server error');
};

module.exports = { errorHandler };
