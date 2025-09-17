const evaluationService = require('../services/evaluationService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

class EvaluationController {
  /**
   * Get task evaluations
   */
  async getTaskEvaluations(req, res) {
    try {
      const { tkid } = req.params;
      const result = await evaluationService.getTaskEvaluations(tkid, req.query);

      return success.ok(res, { evaluations: result.evaluations }, result.meta);
    } catch (err) {
      logger.error('Get task evaluations failed:', err);
      return error.internal(res, 'Failed to get evaluations');
    }
  }

  /**
   * Get evaluation by ID
   */
  async getEvaluationById(req, res) {
    try {
      const { eid } = req.params;

      const evaluation = await evaluationService.getEvaluationById(eid);

      return success.ok(res, evaluation);
    } catch (err) {
      logger.error('Get evaluation failed:', err);
      
      if (err.message === 'Evaluation not found') {
        return error.notFound(res, 'Evaluation not found');
      }
      
      return error.internal(res, 'Failed to get evaluation');
    }
  }

  /**
   * Create manager evaluation
   */
  async createManagerEvaluation(req, res) {
    try {
      const { tkid } = req.params;
      const evaluationData = req.body;
      const userId = req.user.id;

      const evaluation = await evaluationService.createManagerEvaluation(tkid, evaluationData, userId);

      logger.info('Manager evaluation created successfully', { 
        evaluationId: evaluation.id, 
        taskId: tkid, 
        userId 
      });

      return success.created(res, evaluation);
    } catch (err) {
      logger.error('Create manager evaluation failed:', err);
      
      if (err.message === 'Task not found or access denied') {
        return error.forbidden(res, 'Task not found or access denied');
      }
      
      return error.internal(res, 'Failed to create manager evaluation');
    }
  }

  /**
   * Create AI evaluation
   */
  async createAIEvaluation(req, res) {
    try {
      const { tkid } = req.params;
      const evaluationData = req.body;
      const userId = req.user.id;
      const idempotencyKey = req.headers['idempotency-key'];

      const evaluation = await evaluationService.createAIEvaluation(
        tkid, 
        evaluationData, 
        userId, 
        idempotencyKey
      );

      logger.info('AI evaluation created successfully', { 
        evaluationId: evaluation.id, 
        taskId: tkid, 
        userId,
        idempotencyKey 
      });

      return success.created(res, evaluation);
    } catch (err) {
      logger.error('Create AI evaluation failed:', err);
      
      if (err.message === 'Task not found or access denied') {
        return error.forbidden(res, 'Task not found or access denied');
      }
      
      return error.internal(res, 'Failed to create AI evaluation');
    }
  }

  /**
   * Get evaluation runs
   */
  async getEvaluationRuns(req, res) {
    try {
      const { eid } = req.params;

      const runs = await evaluationService.getEvaluationRuns(eid);

      return success.ok(res, { runs });
    } catch (err) {
      logger.error('Get evaluation runs failed:', err);
      return error.internal(res, 'Failed to get evaluation runs');
    }
  }

}

module.exports = new EvaluationController();
