const taskService = require('../services/taskService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

class TaskController {
  /**
   * Get project tasks
   */
  async getProjectTasks(req, res) {
    try {
      const { pid } = req.params;
      const result = await taskService.getProjectTasks(pid, req.query);

      return success.ok(res, { tasks: result.tasks }, result.meta);
    } catch (err) {
      logger.error('Get project tasks failed:', err);
      return error.internal(res, 'Failed to get tasks');
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(req, res) {
    try {
      const { tkid } = req.params;

      const task = await taskService.getTaskById(tkid);

      return success.ok(res, task);
    } catch (err) {
      logger.error('Get task failed:', err);
      
      if (err.message === 'Task not found') {
        return error.notFound(res, 'Task not found');
      }
      
      return error.internal(res, 'Failed to get task');
    }
  }

  /**
   * Create new task
   */
  async createTask(req, res) {
    try {
      const { pid } = req.params;
      const taskData = req.body;
      const userId = req.user.id;

      const task = await taskService.createTask(pid, taskData, userId);

      logger.info('Task created successfully', { taskId: task.id, projectId: pid, userId });

      return success.created(res, task);
    } catch (err) {
      logger.error('Create task failed:', err);
      
      if (err.message === 'Project not found or access denied') {
        return error.forbidden(res, 'Project not found or access denied');
      }
      
      return error.internal(res, 'Failed to create task');
    }
  }

  /**
   * Update task
   */
  async updateTask(req, res) {
    try {
      const { tkid } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const task = await taskService.updateTask(tkid, updateData, userId);

      logger.info('Task updated successfully', { taskId: tkid, userId });

      return success.ok(res, task);
    } catch (err) {
      logger.error('Update task failed:', err);
      
      if (err.message === 'Task not found or access denied') {
        return error.forbidden(res, 'Task not found or access denied');
      }
      
      return error.internal(res, 'Failed to update task');
    }
  }

  /**
   * Delete task
   */
  async deleteTask(req, res) {
    try {
      const { tkid } = req.params;
      const userId = req.user.id;

      await taskService.deleteTask(tkid, userId);

      logger.info('Task deleted successfully', { taskId: tkid, userId });

      return success.noContent(res);
    } catch (err) {
      logger.error('Delete task failed:', err);
      
      if (err.message === 'Task not found or insufficient permissions') {
        return error.forbidden(res, 'Task not found or insufficient permissions');
      }
      
      return error.internal(res, 'Failed to delete task');
    }
  }

  /**
   * Add assignee to task
   */
  async addAssignee(req, res) {
    try {
      const { tkid } = req.params;
      const { user_id } = req.body;
      const userId = req.user.id;

      const assignee = await taskService.addAssignee(tkid, userId, user_id);

      logger.info('Assignee added to task successfully', { taskId: tkid, assigneeId: user_id });

      return success.created(res, assignee);
    } catch (err) {
      logger.error('Add assignee failed:', err);
      
      if (err.message === 'Task not found or access denied') {
        return error.forbidden(res, 'Task not found or access denied');
      }
      
      if (err.message === 'User is already assigned to this task') {
        return error.conflict(res, 'User is already assigned to this task');
      }
      
      return error.internal(res, 'Failed to add assignee');
    }
  }

  /**
   * Remove assignee from task
   */
  async removeAssignee(req, res) {
    try {
      const { tkid, user_id } = req.params;
      const userId = req.user.id;

      await taskService.removeAssignee(tkid, userId, user_id);

      logger.info('Assignee removed from task successfully', { taskId: tkid, assigneeId: user_id });

      return success.noContent(res);
    } catch (err) {
      logger.error('Remove assignee failed:', err);
      
      if (err.message === 'Task not found or access denied') {
        return error.forbidden(res, 'Task not found or access denied');
      }
      
      return error.internal(res, 'Failed to remove assignee');
    }
  }

  /**
   * Change task status
   */
  async changeTaskStatus(req, res) {
    try {
      const { tkid } = req.params;
      const statusData = req.body;
      const userId = req.user.id;

      const task = await taskService.changeTaskStatus(tkid, statusData, userId);

      logger.info('Task status changed successfully', { taskId: tkid, status: statusData.to_status, userId });

      return success.ok(res, task);
    } catch (err) {
      logger.error('Change task status failed:', err);
      
      if (err.message === 'Task not found or access denied') {
        return error.forbidden(res, 'Task not found or access denied');
      }
      
      return error.internal(res, 'Failed to change task status');
    }
  }

  /**
   * Get task status history
   */
  async getTaskStatusHistory(req, res) {
    try {
      const { tkid } = req.params;

      const history = await taskService.getTaskStatusHistory(tkid);

      return success.ok(res, { history });
    } catch (err) {
      logger.error('Get task status history failed:', err);
      return error.internal(res, 'Failed to get task status history');
    }
  }

  /**
   * Add worklog to task
   */
  async addWorklog(req, res) {
    try {
      const { tkid } = req.params;
      const worklogData = req.body;
      const userId = req.user.id;

      const worklog = await taskService.addWorklog(tkid, worklogData, userId);

      logger.info('Worklog added to task successfully', { taskId: tkid, worklogId: worklog.id, userId });

      return success.created(res, worklog);
    } catch (err) {
      logger.error('Add worklog failed:', err);
      
      if (err.message === 'Task not found or access denied') {
        return error.forbidden(res, 'Task not found or access denied');
      }
      
      return error.internal(res, 'Failed to add worklog');
    }
  }

  /**
   * Get task worklogs
   */
  async getTaskWorklogs(req, res) {
    try {
      const { tkid } = req.params;
      const result = await taskService.getTaskWorklogs(tkid, req.query);

      return success.ok(res, { worklogs: result.worklogs }, result.meta);
    } catch (err) {
      logger.error('Get task worklogs failed:', err);
      return error.internal(res, 'Failed to get task worklogs');
    }
  }

  /**
   * Add comment to task
   */
  async addComment(req, res) {
    try {
      const { tkid } = req.params;
      const commentData = req.body;
      const userId = req.user.id;

      const comment = await taskService.addComment(tkid, commentData, userId);

      logger.info('Comment added to task successfully', { taskId: tkid, commentId: comment.id, userId });

      return success.created(res, comment);
    } catch (err) {
      logger.error('Add comment failed:', err);
      
      if (err.message === 'Task not found or access denied') {
        return error.forbidden(res, 'Task not found or access denied');
      }
      
      return error.internal(res, 'Failed to add comment');
    }
  }

  /**
   * Get task comments
   */
  async getTaskComments(req, res) {
    try {
      const { tkid } = req.params;
      const result = await taskService.getTaskComments(tkid, req.query);

      return success.ok(res, { comments: result.comments }, result.meta);
    } catch (err) {
      logger.error('Get task comments failed:', err);
      return error.internal(res, 'Failed to get task comments');
    }
  }
}

module.exports = new TaskController();
