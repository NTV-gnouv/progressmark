const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const config = require('../config');
const { User, GroupMember } = require('../models');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Hash password
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password
   */
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles || []
      },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiresIn }
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        jti: crypto.randomUUID()
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Register new user
   */
  async register(userData) {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await User.createUser({
      email,
      password: hashedPassword,
      name,
      status: 'ACTIVE'
    });

    // Remove password from response
    delete user.password;

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user,
      tokens
    };
  }

  /**
   * Login user
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await User.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Get user roles from group memberships
    const memberships = await GroupMember.getUserGroups(user.id);

    const roles = memberships.map(m => ({
      role: m.role,
      groupId: m.groupId
    }));

    const userWithRoles = {
      ...user,
      roles
    };

    // Generate tokens
    const tokens = this.generateTokens(userWithRoles);

    // Remove password from response
    delete user.password;

    return {
      user,
      tokens
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      // Find user
      const user = await User.findById(decoded.sub);

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('Invalid refresh token');
      }

      // Get user roles
      const memberships = await GroupMember.getUserGroups(user.id);

      const roles = memberships.map(m => ({
        role: m.role,
        groupId: m.groupId
      }));

      const userWithRoles = {
        ...user,
        roles
      };

      // Generate new tokens
      const tokens = this.generateTokens(userWithRoles);

      return {
        user,
        tokens
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email) {
    const user = await User.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // TODO: Store token in database and send email
    logger.info('Password reset token generated', { userId: user.id, email });

    return { success: true };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    // TODO: Implement password reset with token validation
    // For now, this is a placeholder
    throw new Error('Password reset not implemented yet');
  }

  /**
   * Logout (revoke refresh token)
   */
  async logout(refreshToken) {
    // In a more sophisticated implementation, you would store
    // refresh tokens in a database and revoke them here
    // For now, we'll just return success
    return { success: true };
  }
}

module.exports = new AuthService();
