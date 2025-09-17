const { Task } = require('../models');
const logger = require('../utils/logger');

class TaskService {
  /**
   * Get tasks for a project
   */
  async getProjectTasks(projectId, query = {}) {
    try {
      const tasks = await Task.getProjectTasks(projectId, query);
      
      // Add pagination metadata
      const meta = {
        total: tasks.length,
        hasNextPage: false,
        nextCursor: null
      };

      return {
        tasks,
        meta
      };
    } catch (error) {
      logger.error('Error getting project tasks:', error);
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      return task;
    } catch (error) {
      logger.error('Error getting task by ID:', error);
      throw error;
    }
  }

  /**
   * Create new task
   */
  async createTask(taskData) {
    try {
      const task = await Task.create({
        id: require('crypto').randomUUID(),
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'TODO',
        priority: taskData.priority || 'MEDIUM',
        projectId: taskData.projectId,
        creatorId: taskData.creatorId,
        dueDate: taskData.dueDate,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Task created successfully', { taskId: task.id, projectId: taskData.projectId });
      return task;
    } catch (error) {
      logger.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Update task
   */
  async updateTask(taskId, updateData) {
    try {
      const task = await Task.update(taskId, {
        ...updateData,
        updatedAt: new Date()
      });

      if (!task) {
        throw new Error('Task not found');
      }

      logger.info('Task updated successfully', { taskId });
      return task;
    } catch (error) {
      logger.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Delete task
   */
  async deleteTask(taskId) {
    try {
      const result = await Task.delete(taskId);
      logger.info('Task deleted successfully', { taskId });
      return result;
    } catch (error) {
      logger.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(projectId) {
    try {
      const stats = await Task.getProjectTasks(projectId, {});
      
      const statusCounts = stats.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      const priorityCounts = stats.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {});

      return {
        total: stats.length,
        byStatus: statusCounts,
        byPriority: priorityCounts
      };
    } catch (error) {
      logger.error('Error getting task stats:', error);
      throw error;
    }
  }
}

module.exports = new TaskService();