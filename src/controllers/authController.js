const authService = require('../services/authService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Register new user
   */
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      const result = await authService.register({ email, password, name });

      logger.info('User registered successfully', { userId: result.user.id, email });

      return success.created(res, result);
    } catch (err) {
      logger.error('Registration failed:', err);
      
      if (err.message === 'User already exists') {
        return error.conflict(res, 'User already exists');
      }
      
      return error.internal(res, 'Registration failed');
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      logger.info('User logged in successfully', { userId: result.user.id, email });

      return success.ok(res, result);
    } catch (err) {
      logger.error('Login failed:', err);
      
      if (err.message === 'Invalid credentials' || err.message === 'Account is not active') {
        return error.unauthorized(res, 'Invalid credentials');
      }
      
      return error.internal(res, 'Login failed');
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshToken(refreshToken);

      logger.info('Token refreshed successfully', { userId: result.user.id });

      return success.ok(res, result);
    } catch (err) {
      logger.error('Token refresh failed:', err);
      
      if (err.message === 'Invalid refresh token') {
        return error.unauthorized(res, 'Invalid refresh token');
      }
      
      return error.internal(res, 'Token refresh failed');
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      await authService.generatePasswordResetToken(email);

      logger.info('Password reset token generated', { email });

      return success.ok(res, { message: 'Password reset instructions sent to your email' });
    } catch (err) {
      logger.error('Forgot password failed:', err);
      return error.internal(res, 'Password reset failed');
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      await authService.resetPassword(token, newPassword);

      logger.info('Password reset successfully', { token: token.substring(0, 8) + '...' });

      return success.ok(res, { message: 'Password reset successfully' });
    } catch (err) {
      logger.error('Password reset failed:', err);
      
      if (err.message === 'Invalid or expired reset token') {
        return error.badRequest(res, 'Invalid or expired reset token');
      }
      
      return error.internal(res, 'Password reset failed');
    }
  }

  /**
   * Logout user
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      await authService.logout(refreshToken);

      logger.info('User logged out successfully', { userId: req.user?.id });

      return success.noContent(res);
    } catch (err) {
      logger.error('Logout failed:', err);
      return error.internal(res, 'Logout failed');
    }
  }
}

module.exports = new AuthController();
