const prisma = require('../config/database');
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
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: gid,
            userId: userId
          }
        },
        select: {
          role: true
        }
      });

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
        return error.forbidden(res, `Required role: ${requiredRole}`);
      }

      // Attach group info to request
      req.groupId = gid;
      req.userRole = membership.role;

      next();
    } catch (err) {
      logger.error('Group role check error:', err);
      return error.internal(res, 'Role verification failed');
    }
  };
};

/**
 * Check if user has required team role
 */
const requireTeamRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const { tid } = req.params;
      const userId = req.user.id;

      if (!tid) {
        return error.badRequest(res, 'Team ID required');
      }

      // Get team and check if user is member
      const team = await prisma.team.findUnique({
        where: { id: tid },
        select: {
          id: true,
          groupId: true,
          members: {
            where: { userId: userId },
            select: { role: true }
          }
        }
      });

      if (!team) {
        return error.notFound(res, 'Team not found');
      }

      if (team.members.length === 0) {
        return error.forbidden(res, 'You are not a member of this team');
      }

      const userRole = team.members[0].role;

      // Check role hierarchy
      const roleHierarchy = {
        'LEAD': 2,
        'MEMBER': 1
      };

      const userRoleLevel = roleHierarchy[userRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return error.forbidden(res, `Required role: ${requiredRole}`);
      }

      // Attach team info to request
      req.teamId = tid;
      req.groupId = team.groupId;
      req.userTeamRole = userRole;

      next();
    } catch (err) {
      logger.error('Team role check error:', err);
      return error.internal(res, 'Team role verification failed');
    }
  };
};

/**
 * Check if user has required project role
 */
const requireProjectRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const { pid } = req.params;
      const userId = req.user.id;

      if (!pid) {
        return error.badRequest(res, 'Project ID required');
      }

      // Get project and check if user is member
      const project = await prisma.project.findUnique({
        where: { id: pid },
        select: {
          id: true,
          groupId: true,
          members: {
            where: { userId: userId },
            select: { role: true }
          }
        }
      });

      if (!project) {
        return error.notFound(res, 'Project not found');
      }

      if (project.members.length === 0) {
        return error.forbidden(res, 'You are not a member of this project');
      }

      const userRole = project.members[0].role;

      // Check role hierarchy
      const roleHierarchy = {
        'PM': 3,
        'MEMBER': 2,
        'VIEWER': 1
      };

      const userRoleLevel = roleHierarchy[userRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return error.forbidden(res, `Required role: ${requiredRole}`);
      }

      // Attach project info to request
      req.projectId = pid;
      req.groupId = project.groupId;
      req.userProjectRole = userRole;

      next();
    } catch (err) {
      logger.error('Project role check error:', err);
      return error.internal(res, 'Project role verification failed');
    }
  };
};

/**
 * Check if user is admin (platform admin)
 */
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user has admin role in any group
    const adminMembership = await prisma.groupMember.findFirst({
      where: {
        userId: userId,
        role: {
          in: ['OWNER', 'ADMIN']
        }
      }
    });

    if (!adminMembership) {
      return error.forbidden(res, 'Admin access required');
    }

    next();
  } catch (err) {
    logger.error('Admin check error:', err);
    return error.internal(res, 'Admin verification failed');
  }
};

/**
 * Check if user owns or has access to a resource
 */
const requireResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params[`${resourceType}Id`] || req.params.id;

      if (!resourceId) {
        return error.badRequest(res, `${resourceType} ID required`);
      }

      let hasAccess = false;

      switch (resourceType) {
        case 'task':
          // Check if user is assigned to task or has project access
          const task = await prisma.task.findUnique({
            where: { id: resourceId },
            select: {
              id: true,
              projectId: true,
              assignees: {
                where: { userId: userId },
                select: { id: true }
              },
              project: {
                select: {
                  groupId: true,
                  members: {
                    where: { userId: userId },
                    select: { role: true }
                  }
                }
              }
            }
          });

          if (task) {
            hasAccess = task.assignees.length > 0 || task.project.members.length > 0;
            req.groupId = task.project.groupId;
          }
          break;

        case 'project':
          const project = await prisma.project.findUnique({
            where: { id: resourceId },
            select: {
              id: true,
              groupId: true,
              members: {
                where: { userId: userId },
                select: { role: true }
              }
            }
          });

          if (project) {
            hasAccess = project.members.length > 0;
            req.groupId = project.groupId;
          }
          break;

        case 'team':
          const team = await prisma.team.findUnique({
            where: { id: resourceId },
            select: {
              id: true,
              groupId: true,
              members: {
                where: { userId: userId },
                select: { role: true }
              }
            }
          });

          if (team) {
            hasAccess = team.members.length > 0;
            req.groupId = team.groupId;
          }
          break;

        default:
          return error.badRequest(res, 'Invalid resource type');
      }

      if (!hasAccess) {
        return error.forbidden(res, `Access denied to ${resourceType}`);
      }

      next();
    } catch (err) {
      logger.error('Resource access check error:', err);
      return error.internal(res, 'Resource access verification failed');
    }
  };
};

module.exports = {
  requireGroupRole,
  requireTeamRole,
  requireProjectRole,
  requireAdmin,
  requireResourceAccess
};
