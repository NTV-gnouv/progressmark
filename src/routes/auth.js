const express = require('express');
const { authController } = require('../controllers');
const { authRules, handleValidationErrors } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { verifyRefreshToken } = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// POST /auth/register
router.post('/register', 
  authRules.register,
  handleValidationErrors,
  authController.register
);

// POST /auth/login
router.post('/login',
  authRules.login,
  handleValidationErrors,
  authController.login
);

// POST /auth/refresh
router.post('/refresh',
  authRules.refresh,
  handleValidationErrors,
  verifyRefreshToken,
  authController.refresh
);

// POST /auth/forgot
router.post('/forgot',
  authRules.forgotPassword,
  handleValidationErrors,
  authController.forgotPassword
);

// POST /auth/reset
router.post('/reset',
  authRules.resetPassword,
  handleValidationErrors,
  authController.resetPassword
);

// POST /auth/logout
router.post('/logout',
  authRules.refresh,
  handleValidationErrors,
  authController.logout
);

module.exports = router;
