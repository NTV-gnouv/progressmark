const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { notFound } = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const groupRoutes = require('./routes/groups');
const teamRoutes = require('./routes/teams');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const evaluationRoutes = require('./routes/evaluations');
const billingRoutes = require('./routes/billing');
const ticketRoutes = require('./routes/tickets');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const testRoutes = require('./routes/test');
const docsRoutes = require('./routes/docs');

const app = express();

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Security middleware with CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('views/public'));
app.use(express.static('public'));

// Block Chrome DevTools spam requests
app.use((req, res, next) => {
  if (req.url.startsWith('/.well-known/') || req.url === '/favicon.ico') {
    return res.status(404).end();
  }
  next();
});

// Request logging
app.use(requestLogger);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.'
    }
  }
});

app.use('/api/v1', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/evaluations', evaluationRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/test', testRoutes);

// Documentation
app.use('/docs', docsRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 ProgressMark API server running on port ${PORT}`);
  console.log(`\n📖 Documentation & Testing:`);
  console.log(`   📚 API Docs: http://localhost:${PORT}/docs`);
  console.log(`   🧪 API Tester: http://localhost:${PORT}/docs/tester`);
  console.log(`   🎯 Demo Page: http://localhost:${PORT}/docs/demo`);
  console.log(`\n🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`\n🔑 Admin Credentials:`);
  console.log(`   Email: ngthnhvuong@gmail.com`);
  console.log(`   Password: vuongvuive123`);
});

module.exports = app;
