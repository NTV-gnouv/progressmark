const express = require('express');
const { success, error } = require('../utils/response');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all notification routes
router.use(verifyToken);

// Placeholder notification routes - implement as needed
router.get('/', (req, res) => {
  return success.ok(res, { message: 'Notifications endpoint - implement as needed' });
});

module.exports = router;
