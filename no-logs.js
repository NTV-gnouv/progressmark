// Quick script to run server without request logging
process.env.ENABLE_REQUEST_LOGGING = 'false';
process.env.NODE_ENV = 'development';

// Start the server
require('./src/app.js');
