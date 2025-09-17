const express = require('express');
const { evaluationController } = require('../controllers');
const { evaluationRules, commonRules, handleValidationErrors } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');
const { requireResourceAccess } = require('../middleware/rbac');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply authentication to all evaluation routes
router.use(verifyToken);

// GET /tasks/:tkid/evaluations - Get task evaluations
router.get('/tasks/:tkid/evaluations',
  commonRules.id,
  handleValidationErrors,
  requireResourceAccess('task'),
  evaluationController.getTaskEvaluations
);

// POST /tasks/:tkid/evaluations/manager - Create manager evaluation
router.post('/tasks/:tkid/evaluations/manager',
  commonRules.id,
  evaluationRules.manager,
  handleValidationErrors,
  requireResourceAccess('task'),
  evaluationController.createManagerEvaluation
);

// POST /tasks/:tkid/evaluations/ai - Create AI evaluation
router.post('/tasks/:tkid/evaluations/ai',
  commonRules.id,
  evaluationRules.ai,
  handleValidationErrors,
  requireResourceAccess('task'),
  aiLimiter,
  evaluationController.createAIEvaluation
);

// GET /evaluations/:eid - Get evaluation by ID
router.get('/:eid',
  commonRules.id,
  handleValidationErrors,
  evaluationController.getEvaluationById
);

// GET /evaluations/:eid/runs - Get evaluation runs
router.get('/:eid/runs',
  commonRules.id,
  handleValidationErrors,
  evaluationController.getEvaluationRuns
);

module.exports = router;
