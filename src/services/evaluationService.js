const db = require('../config/database');
const logger = require('../utils/logger');
const config = require('../config');
const geminiService = require('./geminiService');

class EvaluationService {
  /**
   * Get evaluations for a task
   */
  async getTaskEvaluations(taskId, query = {}) {
    try {
      let sql = `
        SELECT e.*, u.name as evaluator_name, u.email as evaluator_email
        FROM evaluations e
        LEFT JOIN users u ON e.evaluatorId = u.id
        WHERE e.taskId = ?
      `;
      const params = [taskId];

      if (query.type) {
        sql += ` AND e.type = ?`;
        params.push(query.type);
      }

      sql += ` ORDER BY e.createdAt DESC`;

      if (query.limit) {
        sql += ` LIMIT ${query.limit}`;
      }

      const evaluations = await db.query(sql, params);

      const meta = {
        total: evaluations.length,
        hasNextPage: false,
        nextCursor: null
      };

      return {
        evaluations,
        meta
      };
    } catch (error) {
      logger.error('Error getting task evaluations:', error);
      throw error;
    }
  }

  /**
   * Get evaluation by ID
   */
  async getEvaluationById(evaluationId) {
    try {
      const sql = `
        SELECT e.*, u.name as evaluator_name, u.email as evaluator_email
        FROM evaluations e
        LEFT JOIN users u ON e.evaluatorId = u.id
        WHERE e.id = ?
      `;
      const evaluations = await db.query(sql, [evaluationId]);
      
      if (evaluations.length === 0) {
        throw new Error('Evaluation not found');
      }

      return evaluations[0];
    } catch (error) {
      logger.error('Error getting evaluation by ID:', error);
      throw error;
    }
  }

  /**
   * Create manager evaluation
   */
  async createManagerEvaluation(taskId, evaluationData, userId) {
    try {
      const evaluation = {
        id: require('crypto').randomUUID(),
        taskId,
        evaluatorId: userId,
        type: 'MANAGER',
        score: evaluationData.score,
        feedback: evaluationData.feedback,
        criteria: JSON.stringify(evaluationData.criteria || {}),
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const sql = `
        INSERT INTO evaluations (id, taskId, evaluatorId, type, score, feedback, criteria, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await db.query(sql, [
        evaluation.id,
        evaluation.taskId,
        evaluation.evaluatorId,
        evaluation.type,
        evaluation.score,
        evaluation.feedback,
        evaluation.criteria,
        evaluation.status,
        evaluation.createdAt,
        evaluation.updatedAt
      ]);

      logger.info('Manager evaluation created', { evaluationId: evaluation.id, taskId });
      return evaluation;
    } catch (error) {
      logger.error('Error creating manager evaluation:', error);
      throw error;
    }
  }

  /**
   * Create AI evaluation
   */
  async createAIEvaluation(taskId, evaluationData, userId, idempotencyKey) {
    try {
      // Check for existing evaluation with same idempotency key
      const existingSql = `SELECT id FROM evaluations WHERE criteria->>'$.idempotencyKey' = ?`;
      const existing = await db.query(existingSql, [idempotencyKey]);
      
      if (existing.length > 0) {
        return await this.getEvaluationById(existing[0].id);
      }

      const evaluation = {
        id: require('crypto').randomUUID(),
        taskId,
        evaluatorId: userId,
        type: 'AI',
        score: null,
        feedback: null,
        criteria: JSON.stringify({
          ...evaluationData.criteria,
          idempotencyKey
        }),
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const sql = `
        INSERT INTO evaluations (id, taskId, evaluatorId, type, score, feedback, criteria, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await db.query(sql, [
        evaluation.id,
        evaluation.taskId,
        evaluation.evaluatorId,
        evaluation.type,
        evaluation.score,
        evaluation.feedback,
        evaluation.criteria,
        evaluation.status,
        evaluation.createdAt,
        evaluation.updatedAt
      ]);

      // Trigger AI evaluation asynchronously
      this.triggerAIEvaluation(evaluation.id).catch(error => {
        logger.error('AI evaluation failed:', error);
      });

      logger.info('AI evaluation created', { evaluationId: evaluation.id, taskId });
      return evaluation;
    } catch (error) {
      logger.error('Error creating AI evaluation:', error);
      throw error;
    }
  }

  /**
   * Trigger AI evaluation
   */
  async triggerAIEvaluation(evaluationId) {
    try {
      const evaluation = await this.getEvaluationById(evaluationId);
      
      if (evaluation.type !== 'AI' || evaluation.status !== 'PENDING') {
        throw new Error('Invalid evaluation for AI processing');
      }

      // Get task details
      const taskSql = `
        SELECT t.*, p.name as project_name
        FROM tasks t
        LEFT JOIN projects p ON t.projectId = p.id
        WHERE t.id = ?
      `;
      const tasks = await db.query(taskSql, [evaluation.taskId]);
      
      if (tasks.length === 0) {
        throw new Error('Task not found');
      }

      const task = tasks[0];

      // Call Gemini service for AI evaluation
      const aiResult = await geminiService.evaluateTask(task, evaluation.criteria);

      // Update evaluation with AI result
      const updateSql = `
        UPDATE evaluations 
        SET score = ?, feedback = ?, status = 'COMPLETED', updatedAt = ?
        WHERE id = ?
      `;
      
      await db.query(updateSql, [
        aiResult.score,
        aiResult.feedback,
        new Date(),
        evaluationId
      ]);

      logger.info('AI evaluation completed', { evaluationId, score: aiResult.score });
      return aiResult;
    } catch (error) {
      // Update evaluation status to failed
      const updateSql = `
        UPDATE evaluations 
        SET status = 'FAILED', updatedAt = ?
        WHERE id = ?
      `;
      
      await db.query(updateSql, [new Date(), evaluationId]);
      
      logger.error('AI evaluation failed:', error);
      throw error;
    }
  }
}

module.exports = new EvaluationService();