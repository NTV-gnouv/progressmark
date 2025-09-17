const express = require('express');
const { verifyToken } = require('../middleware/auth');
const geminiService = require('../services/geminiService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// Apply authentication to all test routes
router.use(verifyToken);

// GET /test/gemini - Test Gemini connection
router.get('/gemini', async (req, res) => {
  try {
    const response = await geminiService.testConnection();
    
    logger.info('Gemini connection test successful');
    
    return success.ok(res, { 
      message: 'Gemini AI connection successful',
      response: response
    });
  } catch (err) {
    logger.error('Gemini connection test failed:', err);
    return error.internal(res, 'Gemini AI connection failed');
  }
});

module.exports = router;
