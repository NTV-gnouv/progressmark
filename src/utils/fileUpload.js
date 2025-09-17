const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('./logger');

// Ensure upload directory exists
const uploadDir = config.upload.uploadPath;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1 // Single file per request
  }
});

/**
 * Middleware for single file upload
 */
const uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

/**
 * Middleware for multiple file upload
 */
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Get file URL
 */
const getFileUrl = (filename) => {
  if (config.storage.type === 's3') {
    // TODO: Implement S3 URL generation
    return `https://${config.storage.aws.bucket}.s3.${config.storage.aws.region}.amazonaws.com/${filename}`;
  } else {
    // Local storage
    return `/uploads/${filename}`;
  }
};

/**
 * Delete file
 */
const deleteFile = async (filename) => {
  try {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('File deleted successfully', { filename });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('File deletion failed:', error);
    return false;
  }
};

/**
 * Get file info
 */
const getFileInfo = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    url: getFileUrl(file.filename)
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  getFileUrl,
  deleteFile,
  getFileInfo
};
