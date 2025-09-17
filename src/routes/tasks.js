const express = require('express');
const { taskController } = require('../controllers');
const { taskRules, commonRules, handleValidationErrors } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');
const { requireProjectRole, requireResourceAccess } = require('../middleware/rbac');

const router = express.Router();

// Apply authentication to all task routes
router.use(verifyToken);

// GET /projects/:pid/tasks - Get project tasks
router.get('/projects/:pid/tasks',
  commonRules.id,
  handleValidationErrors,
  requireProjectRole('VIEWER'),
  taskController.getProjectTasks
);

// POST /projects/:pid/tasks - Create new task
router.post('/projects/:pid/tasks',
  commonRules.id,
  taskRules.create,
  handleValidationErrors,
  requireProjectRole('MEMBER'),
  taskController.createTask
);

// GET /tasks/:tkid - Get task by ID
router.get('/:tkid',
  commonRules.id,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.getTaskById
);

// PATCH /tasks/:tkid - Update task
router.patch('/:tkid',
  commonRules.id,
  taskRules.update,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.updateTask
);

// DELETE /tasks/:tkid - Delete task
router.delete('/:tkid',
  commonRules.id,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.deleteTask
);

// POST /tasks/:tkid/assignees - Add assignee to task
router.post('/:tkid/assignees',
  commonRules.id,
  taskRules.assignee,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.addAssignee
);

// DELETE /tasks/:tkid/assignees/:user_id - Remove assignee from task
router.delete('/:tkid/assignees/:user_id',
  commonRules.id,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.removeAssignee
);

// POST /tasks/:tkid/status - Change task status
router.post('/:tkid/status',
  commonRules.id,
  taskRules.statusChange,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.changeTaskStatus
);

// GET /tasks/:tkid/status-history - Get task status history
router.get('/:tkid/status-history',
  commonRules.id,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.getTaskStatusHistory
);

// POST /tasks/:tkid/worklogs - Add worklog to task
router.post('/:tkid/worklogs',
  commonRules.id,
  taskRules.worklog,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.addWorklog
);

// GET /tasks/:tkid/worklogs - Get task worklogs
router.get('/:tkid/worklogs',
  commonRules.id,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.getTaskWorklogs
);

// POST /tasks/:tkid/comments - Add comment to task
router.post('/:tkid/comments',
  commonRules.id,
  taskRules.comment,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.addComment
);

// GET /tasks/:tkid/comments - Get task comments
router.get('/:tkid/comments',
  commonRules.id,
  handleValidationErrors,
  requireResourceAccess('task'),
  taskController.getTaskComments
);

module.exports = router;
