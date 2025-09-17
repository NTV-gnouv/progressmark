const prisma = require('../config/database');
const logger = require('./logger');

/**
 * Audit log service
 */
class AuditService {
  /**
   * Log an action
   */
  async logAction(actorId, groupId, action, targetType, targetId, metadata = null) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          actorId,
          groupId,
          action,
          targetType,
          targetId,
          metadata
        }
      });

      logger.info('Audit log created', {
        auditLogId: auditLog.id,
        actorId,
        groupId,
        action,
        targetType,
        targetId
      });

      return auditLog;
    } catch (error) {
      logger.error('Audit log creation failed:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log user actions
   */
  async logUserAction(actorId, groupId, action, targetId, metadata = null) {
    return this.logAction(actorId, groupId, action, 'USER', targetId, metadata);
  }

  /**
   * Log group actions
   */
  async logGroupAction(actorId, groupId, action, targetId, metadata = null) {
    return this.logAction(actorId, groupId, action, 'GROUP', targetId, metadata);
  }

  /**
   * Log team actions
   */
  async logTeamAction(actorId, groupId, action, targetId, metadata = null) {
    return this.logAction(actorId, groupId, action, 'TEAM', targetId, metadata);
  }

  /**
   * Log project actions
   */
  async logProjectAction(actorId, groupId, action, targetId, metadata = null) {
    return this.logAction(actorId, groupId, action, 'PROJECT', targetId, metadata);
  }

  /**
   * Log task actions
   */
  async logTaskAction(actorId, groupId, action, targetId, metadata = null) {
    return this.logAction(actorId, groupId, action, 'TASK', targetId, metadata);
  }

  /**
   * Log billing actions
   */
  async logBillingAction(actorId, groupId, action, targetId, metadata = null) {
    return this.logAction(actorId, groupId, action, 'BILLING', targetId, metadata);
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(groupId, filters = {}) {
    const {
      actorId,
      action,
      targetType,
      from,
      to,
      cursor,
      limit = 50
    } = filters;

    const where = {
      groupId,
      ...(actorId && { actorId }),
      ...(action && { action }),
      ...(targetType && { targetType }),
      ...(from && to && {
        createdAt: {
          gte: new Date(from),
          lte: new Date(to)
        }
      })
    };

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const hasNextPage = auditLogs.length > limit;
    if (hasNextPage) auditLogs.pop();

    return {
      auditLogs,
      hasNextPage,
      nextCursor: hasNextPage ? auditLogs[auditLogs.length - 1].id : null
    };
  }
}

module.exports = new AuditService();
