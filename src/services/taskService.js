const prisma = require('../config/database');
const { processPaginationParams, buildCursorWhere, buildOrderBy, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

class TaskService {
  /**
   * Get tasks for a project
   */
  async getProjectTasks(projectId, query = {}) {
    const pagination = processPaginationParams(query);
    
    const where = {
      projectId,
      ...(query.status && { status: { in: query.status.split(',') } }),
      ...(query.assignee && { assignees: { some: { userId: query.assignee } } }),
      ...(query.priority && { priority: { in: query.priority.split(',') } }),
      ...(query.from && { createdAt: { gte: new Date(query.from) } }),
      ...(query.to && { createdAt: { lte: new Date(query.to) } }),
      ...(query.q && {
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } }
        ]
      })
    };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: buildOrderBy(pagination.primarySortField, pagination.primarySortOrder),
      take: pagination.limit + 1,
      skip: pagination.cursor ? 1 : 0,
      cursor: pagination.cursor ? {
        id: JSON.parse(Buffer.from(pagination.cursor, 'base64').toString()).id
      } : undefined,
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            worklogs: true,
            comments: true,
            attachments: true
          }
        }
      }
    });

    const hasNextPage = tasks.length > pagination.limit;
    if (hasNextPage) tasks.pop();

    const meta = buildPaginationMeta(tasks, pagination.limit, pagination.primarySortField, pagination.primarySortOrder);

    return { tasks, meta };
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            groupId: true
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        worklogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        },
        evaluations: {
          orderBy: { createdAt: 'desc' },
          include: {
            runs: {
              orderBy: { startedAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  /**
   * Create new task
   */
  async createTask(projectId, taskData, userId) {
    const { title, description, priority, status, start_date, due_date, estimate_hours, assignees } = taskData;

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: { userId }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        startDate: start_date ? new Date(start_date) : null,
        dueDate: due_date ? new Date(due_date) : null,
        estimateHours: estimate_hours,
        createdBy: userId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            groupId: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Add assignees if provided
    if (assignees && assignees.length > 0) {
      await prisma.taskAssignee.createMany({
        data: assignees.map(userId => ({
          taskId: task.id,
          userId
        }))
      });
    }

    // Get full task with assignees
    const fullTask = await this.getTaskById(task.id);

    return fullTask;
  }

  /**
   * Update task
   */
  async updateTask(taskId, updateData, userId) {
    // Check if user has access to task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { assignees: { some: { userId } } },
          { project: { members: { some: { userId } } } }
        ]
      }
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    const updatePayload = {};
    if (updateData.title !== undefined) updatePayload.title = updateData.title;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.priority !== undefined) updatePayload.priority = updateData.priority;
    if (updateData.status !== undefined) updatePayload.status = updateData.status;
    if (updateData.start_date !== undefined) updatePayload.startDate = updateData.start_date ? new Date(updateData.start_date) : null;
    if (updateData.due_date !== undefined) updatePayload.dueDate = updateData.due_date ? new Date(updateData.due_date) : null;
    if (updateData.estimate_hours !== undefined) updatePayload.estimateHours = updateData.estimate_hours;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updatePayload,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            groupId: true
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return updatedTask;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId, userId) {
    // Check if user has permission to delete task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          members: {
            some: {
              userId,
              role: { in: ['PM'] }
            }
          }
        }
      }
    });

    if (!task) {
      throw new Error('Task not found or insufficient permissions');
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    return { success: true };
  }

  /**
   * Add assignee to task
   */
  async addAssignee(taskId, userId, assigneeUserId) {
    // Check if user has access to task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { assignees: { some: { userId } } },
          { project: { members: { some: { userId } } } }
        ]
      }
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    // Check if assignee is already assigned
    const existingAssignee = await prisma.taskAssignee.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId: assigneeUserId
        }
      }
    });

    if (existingAssignee) {
      throw new Error('User is already assigned to this task');
    }

    const assignee = await prisma.taskAssignee.create({
      data: {
        taskId,
        userId: assigneeUserId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return assignee;
  }

  /**
   * Remove assignee from task
   */
  async removeAssignee(taskId, userId, assigneeUserId) {
    // Check if user has access to task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { assignees: { some: { userId } } },
          { project: { members: { some: { userId } } } }
        ]
      }
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    await prisma.taskAssignee.deleteMany({
      where: {
        taskId,
        userId: assigneeUserId
      }
    });

    return { success: true };
  }

  /**
   * Change task status
   */
  async changeTaskStatus(taskId, statusData, userId) {
    const { to_status, note } = statusData;

    // Get current task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { assignees: { some: { userId } } },
          { project: { members: { some: { userId } } } }
        ]
      }
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: to_status }
    });

    // Record status change
    await prisma.taskStatusHistory.create({
      data: {
        taskId,
        fromStatus: task.status,
        toStatus: to_status,
        note
      }
    });

    return updatedTask;
  }

  /**
   * Get task status history
   */
  async getTaskStatusHistory(taskId) {
    const history = await prisma.taskStatusHistory.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' }
    });

    return history;
  }

  /**
   * Add worklog to task
   */
  async addWorklog(taskId, worklogData, userId) {
    const { content, spent_minutes } = worklogData;

    // Check if user has access to task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { assignees: { some: { userId } } },
          { project: { members: { some: { userId } } } }
        ]
      }
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    const worklog = await prisma.worklog.create({
      data: {
        taskId,
        userId,
        content,
        spentMinutes: spent_minutes
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return worklog;
  }

  /**
   * Get task worklogs
   */
  async getTaskWorklogs(taskId, query = {}) {
    const pagination = processPaginationParams(query);

    const worklogs = await prisma.worklog.findMany({
      where: { taskId },
      orderBy: buildOrderBy(pagination.primarySortField, pagination.primarySortOrder),
      take: pagination.limit + 1,
      skip: pagination.cursor ? 1 : 0,
      cursor: pagination.cursor ? {
        id: JSON.parse(Buffer.from(pagination.cursor, 'base64').toString()).id
      } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const hasNextPage = worklogs.length > pagination.limit;
    if (hasNextPage) worklogs.pop();

    const meta = buildPaginationMeta(worklogs, pagination.limit, pagination.primarySortField, pagination.primarySortOrder);

    return { worklogs, meta };
  }

  /**
   * Add comment to task
   */
  async addComment(taskId, commentData, userId) {
    const { content } = commentData;

    // Check if user has access to task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { assignees: { some: { userId } } },
          { project: { members: { some: { userId } } } }
        ]
      }
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return comment;
  }

  /**
   * Get task comments
   */
  async getTaskComments(taskId, query = {}) {
    const pagination = processPaginationParams(query);

    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: buildOrderBy(pagination.primarySortField, pagination.primarySortOrder),
      take: pagination.limit + 1,
      skip: pagination.cursor ? 1 : 0,
      cursor: pagination.cursor ? {
        id: JSON.parse(Buffer.from(pagination.cursor, 'base64').toString()).id
      } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const hasNextPage = comments.length > pagination.limit;
    if (hasNextPage) comments.pop();

    const meta = buildPaginationMeta(comments, pagination.limit, pagination.primarySortField, pagination.primarySortOrder);

    return { comments, meta };
  }
}

module.exports = new TaskService();
