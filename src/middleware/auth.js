const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Verify JWT access token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error.unauthorized(res, 'Access token required');
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Check if user still exists and is active
      const user = await User.findById(decoded.sub);

      if (!user || user.status !== 'ACTIVE') {
        return error.unauthorized(res, 'Invalid or expired token');
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: decoded.roles || []
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return error.unauthorized(res, 'Token expired');
      } else if (jwtError.name === 'JsonWebTokenError') {
        return error.unauthorized(res, 'Invalid token');
      }
      throw jwtError;
    }
  } catch (err) {
    logger.error('Token verification error:', err);
    return error.internal(res, 'Token verification failed');
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return error.unauthorized(res, 'Refresh token required');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      // Check if user still exists and is active
      const user = await User.findById(decoded.sub);

      if (!user || user.status !== 'ACTIVE') {
        return error.unauthorized(res, 'Invalid or expired refresh token');
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return error.unauthorized(res, 'Refresh token expired');
      } else if (jwtError.name === 'JsonWebTokenError') {
        return error.unauthorized(res, 'Invalid refresh token');
      }
      throw jwtError;
    }
  } catch (err) {
    logger.error('Refresh token verification error:', err);
    return error.internal(res, 'Refresh token verification failed');
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      const user = await User.findById(decoded.sub);

      if (user && user.status === 'ACTIVE') {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: decoded.roles || []
        };
      }
    } catch (jwtError) {
      // Silently ignore token errors for optional auth
    }

    next();
  } catch (err) {
    logger.error('Optional auth error:', err);
    next();
  }
};

module.exports = {
  verifyToken,
  verifyRefreshToken,
  optionalAuth
};
