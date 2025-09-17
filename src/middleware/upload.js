const { uploadSingle, uploadMultiple, getFileInfo } = require('../utils/fileUpload');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Single file upload middleware
 */
const uploadSingleFile = (fieldName = 'file') => {
  return (req, res, next) => {
    uploadSingle(fieldName)(req, res, (err) => {
      if (err) {
        logger.error('File upload error:', err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error.badRequest(res, 'File too large');
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return error.badRequest(res, 'Too many files');
        }
        
        if (err.message.includes('File type')) {
          return error.badRequest(res, err.message);
        }
        
        return error.internal(res, 'File upload failed');
      }
      
      if (req.file) {
        req.fileInfo = getFileInfo(req.file);
      }
      
      next();
    });
  };
};

/**
 * Multiple files upload middleware
 */
const uploadMultipleFiles = (fieldName = 'files', maxCount = 5) => {
  return (req, res, next) => {
    uploadMultiple(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        logger.error('File upload error:', err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error.badRequest(res, 'File too large');
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return error.badRequest(res, 'Too many files');
        }
        
        if (err.message.includes('File type')) {
          return error.badRequest(res, err.message);
        }
        
        return error.internal(res, 'File upload failed');
      }
      
      if (req.files && req.files.length > 0) {
        req.filesInfo = req.files.map(file => getFileInfo(file));
      }
      
      next();
    });
  };
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles
};
