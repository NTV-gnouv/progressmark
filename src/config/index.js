require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d'
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
  },
  
  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 26214400, // 25MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip'
    ]
  },
  
  // Email
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.FROM_EMAIL || 'noreply@progressmark.com'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 6,
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 300000,
    aiMax: parseInt(process.env.AI_RATE_LIMIT_MAX) || 10,
    aiWindowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 900000
  },
  
  // AI Integration
  ai: {
    webhookSecret: process.env.AI_WEBHOOK_SECRET,
    apiUrl: process.env.AI_API_URL
  },
  
  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },
  
  // Storage
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET
    }
  }
};

module.exports = config;
