// Test script to check logging behavior
const logger = require('./src/utils/logger');

console.log('Testing logger configuration...');

// Test different log levels
logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message');

console.log('Logger test completed. Check if messages appear above.');
