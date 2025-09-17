const prisma = require('../config/database');
const { processPaginationParams, buildOrderBy, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');
const config = require('../config');
const geminiService = require('./geminiService');

class EvaluationService {
  /**
   * Get evaluations for a task
   */
  async getTaskEvaluations(taskId, query = {}) {
    const pagination = processPaginationParams(query);
    
    const where = {
      taskId,
      ...(query.type && { type: query.type })
    };

    const evaluations = await prisma.evaluation.findMany({
      where,
      orderBy: buildOrderBy(pagination.primarySortField, pagination.primarySortOrder),
      take: pagination.limit + 1,
      skip: pagination.cursor ? 1 : 0,
      cursor: pagination.cursor ? {
        id: JSON.parse(Buffer.from(pagination.cursor, 'base64').toString()).id
      } : undefined,
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      }
    });

    const hasNextPage = evaluations.length > pagination.limit;
    if (hasNextPage) evaluations.pop();

    const meta = buildPaginationMeta(evaluations, pagination.limit, pagination.primarySortField, pagination.primarySortOrder);

    return { evaluations, meta };
  }

  /**
   * Get evaluation by ID
   */
  async getEvaluationById(evaluationId) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
                groupId: true
              }
            }
          }
        },
        runs: {
          orderBy: { startedAt: 'desc' }
        }
      }
    });

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    return evaluation;
  }

  /**
   * Create manager evaluation
   */
  async createManagerEvaluation(taskId, evaluationData, userId) {
    const { score_percent, summary } = evaluationData;

    // Check if user has access to task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { assignees: { some: { userId } } },
          { project: { members: { some: { userId, role: { in: ['PM'] } } } } }
        ]
      }
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    // Create evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        taskId,
        type: 'MANAGER',
        status: 'COMPLETED',
        scorePercent: score_percent,
        summary,
        verdict: this.getVerdictFromScore(score_percent)
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
                groupId: true
              }
            }
          }
        }
      }
    });

    return evaluation;
  }

  /**
   * Create AI evaluation
   */
  async createAIEvaluation(taskId, evaluationData, userId, idempotencyKey) {
    const { context_payload } = evaluationData;

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

    // Check for existing evaluation with same idempotency key
    if (idempotencyKey) {
      const existingEvaluation = await prisma.evaluation.findFirst({
        where: {
          taskId,
          type: 'AI',
          contextPayload: {
            path: ['idempotencyKey'],
            equals: idempotencyKey
          }
        }
      });

      if (existingEvaluation) {
        return existingEvaluation;
      }
    }

    // Create evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        taskId,
        type: 'AI',
        status: 'PENDING',
        contextPayload: {
          ...context_payload,
          idempotencyKey
        }
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
                groupId: true
              }
            }
          }
        }
      }
    });

    // Trigger AI evaluation (async)
    this.triggerAIEvaluation(evaluation.id).catch(err => {
      logger.error('AI evaluation trigger failed:', err);
    });

    return evaluation;
  }

  /**
   * Trigger AI evaluation (async)
   */
  async triggerAIEvaluation(evaluationId) {
    try {
      // Update evaluation status to running
      await prisma.evaluation.update({
        where: { id: evaluationId },
        data: { status: 'RUNNING' }
      });

      // Create evaluation run
      const run = await prisma.evaluationRun.create({
        data: {
          evaluationId,
          status: 'RUNNING'
        }
      });

      // Get evaluation to find taskId
      const evaluation = await prisma.evaluation.findUnique({
        where: { id: evaluationId },
        select: { taskId: true }
      });

      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      // Get task data and worklogs for AI evaluation
      const task = await prisma.task.findUnique({
        where: { id: evaluation.taskId },
        include: {
          worklogs: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!task) {
        throw new Error('Task not found for evaluation');
      }

      // Call Gemini AI service
      try {
        const aiResult = await geminiService.evaluateTaskProgress(task, task.worklogs);
        
        await prisma.evaluationRun.update({
          where: { id: run.id },
          data: {
            status: 'COMPLETED',
            outputJson: aiResult,
            completedAt: new Date()
          }
        });

        await prisma.evaluation.update({
          where: { id: evaluationId },
          data: {
            status: 'COMPLETED',
            scorePercent: aiResult.scorePercent,
            summary: aiResult.summary,
            verdict: aiResult.verdict
          }
        });

        logger.info('AI evaluation completed', { 
          evaluationId, 
          runId: run.id,
          score: aiResult.scorePercent 
        });
      } catch (aiError) {
        logger.error('Gemini AI evaluation failed:', aiError);
        
        await prisma.evaluationRun.update({
          where: { id: run.id },
          data: {
            status: 'FAILED',
            errorMessage: aiError.message,
            completedAt: new Date()
          }
        });

        await prisma.evaluation.update({
          where: { id: evaluationId },
          data: { status: 'FAILED' }
        });
      }

    } catch (err) {
      logger.error('AI evaluation trigger error:', err);
      throw err;
    }
  }

  /**
   * Get evaluation runs
   */
  async getEvaluationRuns(evaluationId) {
    const runs = await prisma.evaluationRun.findMany({
      where: { evaluationId },
      orderBy: { startedAt: 'desc' }
    });

    return runs;
  }


  /**
   * Get verdict from score
   */
  getVerdictFromScore(score) {
    if (score >= 80) return 'pass';
    if (score >= 60) return 'borderline';
    return 'fail';
  }

  /**
   * Generate mock AI result
   */
  generateMockAIResult() {
    const score = Math.floor(Math.random() * 100);
    return {
      scorePercent: score,
      verdict: this.getVerdictFromScore(score),
      summary: `AI evaluation completed with score ${score}%. This is a mock result for testing purposes.`,
      rubric: [
        {
          criterion: 'Code Quality',
          score: Math.floor(score * 0.3),
          evidence: 'Code follows best practices and is well-structured.'
        },
        {
          criterion: 'Functionality',
          score: Math.floor(score * 0.4),
          evidence: 'All required features are implemented correctly.'
        },
        {
          criterion: 'Documentation',
          score: Math.floor(score * 0.3),
          evidence: 'Code is well-documented with clear comments.'
        }
      ]
    };
  }
}

module.exports = new EvaluationService();
