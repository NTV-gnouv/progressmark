const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * General rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter (stricter for login attempts)
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI evaluation rate limiter
 */
const aiLimiter = rateLimit({
  windowMs: config.rateLimit.aiWindowMs,
  max: config.rateLimit.aiMax,
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'AI evaluation rate limit exceeded, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment confirmation rate limiter
 */
const paymentLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5, // 5 attempts per minute
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many payment attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many file uploads, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  aiLimiter,
  paymentLimiter,
  uploadLimiter
};
