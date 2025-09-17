/**
 * Standard API response formatter
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} ok - Success status
 * @param {any} data - Response data
 * @param {Object|null} error - Error object
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
const sendResponse = (res, statusCode, ok, data = null, error = null, meta = null) => {
  const response = { ok };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (error !== null) {
    response.error = error;
  }
  
  if (meta !== null) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Success response helpers
 */
const success = {
  ok: (res, data = null, meta = null) => sendResponse(res, 200, true, data, null, meta),
  created: (res, data = null, meta = null) => sendResponse(res, 201, true, data, null, meta),
  noContent: (res) => sendResponse(res, 204, true),
};

/**
 * Error response helpers
 */
const error = {
  badRequest: (res, message = 'Bad Request', details = null) => 
    sendResponse(res, 400, false, null, { code: 'VALIDATION_ERROR', message, details }),
  
  unauthorized: (res, message = 'Authentication required') => 
    sendResponse(res, 401, false, null, { code: 'AUTH_REQUIRED', message }),
  
  forbidden: (res, message = 'Access forbidden') => 
    sendResponse(res, 403, false, null, { code: 'FORBIDDEN', message }),
  
  notFound: (res, message = 'Resource not found') => 
    sendResponse(res, 404, false, null, { code: 'NOT_FOUND', message }),
  
  conflict: (res, message = 'Resource conflict', details = null) => 
    sendResponse(res, 409, false, null, { code: 'CONFLICT', message, details }),
  
  paymentRequired: (res, message = 'Payment required') => 
    sendResponse(res, 402, false, null, { code: 'PAYMENT_REQUIRED', message }),
  
  limitExceeded: (res, message = 'Plan limit exceeded') => 
    sendResponse(res, 429, false, null, { code: 'LIMIT_EXCEEDED', message }),
  
  rateLimited: (res, message = 'Too many requests') => 
    sendResponse(res, 429, false, null, { code: 'RATE_LIMITED', message }),
  
  internal: (res, message = 'Internal server error') => 
    sendResponse(res, 500, false, null, { code: 'INTERNAL', message }),
};

module.exports = {
  sendResponse,
  success,
  error
};
