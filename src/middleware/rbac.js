const { GroupMember } = require('../models');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Check if user has required group role
 */
const requireGroupRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const { gid } = req.params;
      const userId = req.user.id;

      if (!gid) {
        return error.badRequest(res, 'Group ID required');
      }

      // Get user's role in the group
      const membership = await GroupMember.findByUserAndGroup(userId, gid);

      if (!membership) {
        return error.forbidden(res, 'You are not a member of this group');
      }

      // Check role hierarchy
      const roleHierarchy = {
        'OWNER': 4,
        'ADMIN': 3,
        'BILLING_ADMIN': 2,
        'MEMBER': 1
      };

      const userRoleLevel = roleHierarchy[membership.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return error.forbidden(res, `Requires ${requiredRole} role or higher`);
      }

      // Attach membership info to request
      req.membership = membership;
      next();
    } catch (err) {
      logger.error('RBAC middleware error:', err);
      return error.internalServerError(res, 'Authorization check failed');
    }
  };
};

/**
 * Check if user is group admin
 */
const requireGroupAdmin = requireGroupRole('ADMIN');

/**
 * Check if user is group owner
 */
const requireGroupOwner = requireGroupRole('OWNER');

/**
 * Check if user is billing admin
 */
const requireBillingAdmin = requireGroupRole('BILLING_ADMIN');

/**
 * Check if user is group member (any role)
 */
const requireGroupMember = requireGroupRole('MEMBER');

/**
 * Check if user can access resource
 */
const requireResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { gid } = req.params;

      // For now, just check if user is member of the group
      const membership = await GroupMember.findByUserAndGroup(userId, gid);

      if (!membership) {
        return error.forbidden(res, 'Access denied');
      }

      req.membership = membership;
      next();
    } catch (err) {
      logger.error('Resource access check error:', err);
      return error.internalServerError(res, 'Access check failed');
    }
  };
};

module.exports = {
  requireGroupRole,
  requireGroupAdmin,
  requireGroupOwner,
  requireBillingAdmin,
  requireGroupMember,
  requireResourceAccess
};