const { body, param, query, validationResult } = require('express-validator');
const { error } = require('../utils/response');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path,
      issue: err.msg,
      value: err.value
    }));

    return error.badRequest(res, 'Validation failed', errorDetails);
  }
  
  next();
};

/**
 * Common validation rules
 */
const commonRules = {
  // ID validation
  id: param('id').isString().notEmpty().withMessage('ID is required'),
  
  // Pagination
  pagination: [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('cursor').optional().isString().withMessage('Cursor must be a string'),
    query('sort').optional().isString().withMessage('Sort must be a string')
  ],

  // Search
  search: query('q').optional().isString().withMessage('Search query must be a string'),

  // Status filters
  statusFilter: query('status').optional().isString().withMessage('Status must be a string')
};

/**
 * Auth validation rules
 */
const authRules = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').isString().isLength({ min: 1, max: 120 }).withMessage('Name must be 1-120 characters')
  ],

  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isString().notEmpty().withMessage('Password required')
  ],

  refresh: [
    body('refreshToken').isString().notEmpty().withMessage('Refresh token required')
  ],

  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ],

  resetPassword: [
    body('token').isString().notEmpty().withMessage('Reset token required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ]
};

/**
 * Group validation rules
 */
const groupRules = {
  create: [
    body('name').isString().isLength({ min: 1, max: 120 }).withMessage('Name must be 1-120 characters'),
    body('slug').matches(/^[a-z0-9-]{3,32}$/).withMessage('Slug must be 3-32 characters, lowercase letters, numbers, and hyphens only'),
    body('color').optional().isString().withMessage('Color must be a string')
  ],

  update: [
    body('name').optional().isString().isLength({ min: 1, max: 120 }).withMessage('Name must be 1-120 characters'),
    body('slug').optional().matches(/^[a-z0-9-]{3,32}$/).withMessage('Slug must be 3-32 characters, lowercase letters, numbers, and hyphens only'),
    body('color').optional().isString().withMessage('Color must be a string')
  ],

  addMember: [
    body('user_id').optional().isString().withMessage('User ID must be a string'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('role').isIn(['OWNER', 'ADMIN', 'MEMBER', 'BILLING_ADMIN']).withMessage('Invalid role'),
    body().custom((value, { req }) => {
      if (!value.user_id && !value.email) {
        throw new Error('Either user_id or email is required');
      }
      return true;
    })
  ]
};

/**
 * Team validation rules
 */
const teamRules = {
  create: [
    body('name').isString().isLength({ min: 1, max: 120 }).withMessage('Name must be 1-120 characters'),
    body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters')
  ],

  update: [
    body('name').optional().isString().isLength({ min: 1, max: 120 }).withMessage('Name must be 1-120 characters'),
    body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters')
  ],

  addMember: [
    body('user_id').isString().withMessage('User ID required'),
    body('role').isIn(['LEAD', 'MEMBER']).withMessage('Invalid role')
  ]
};

/**
 * Project validation rules
 */
const projectRules = {
  create: [
    body('name').isString().isLength({ min: 1, max: 120 }).withMessage('Name must be 1-120 characters'),
    body('code').matches(/^[A-Z0-9_-]{2,12}$/).withMessage('Code must be 2-12 characters, uppercase letters, numbers, underscore, and hyphen only'),
    body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('team_id').optional().isString().withMessage('Team ID must be a string'),
    body('start_date').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    body('due_date').optional().isISO8601().withMessage('Due date must be valid ISO 8601 date'),
    body('status').optional().isIn(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status')
  ],

  update: [
    body('name').optional().isString().isLength({ min: 1, max: 120 }).withMessage('Name must be 1-120 characters'),
    body('code').optional().matches(/^[A-Z0-9_-]{2,12}$/).withMessage('Code must be 2-12 characters, uppercase letters, numbers, underscore, and hyphen only'),
    body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('start_date').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    body('due_date').optional().isISO8601().withMessage('Due date must be valid ISO 8601 date'),
    body('status').optional().isIn(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status')
  ],

  addMember: [
    body('user_id').isString().withMessage('User ID required'),
    body('role').isIn(['PM', 'MEMBER', 'VIEWER']).withMessage('Invalid role')
  ]
};

/**
 * Task validation rules
 */
const taskRules = {
  create: [
    body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('description').optional().isString().isLength({ max: 10000 }).withMessage('Description must be less than 10000 characters'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
    body('status').optional().isIn(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELED']).withMessage('Invalid status'),
    body('start_date').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    body('due_date').optional().isISO8601().withMessage('Due date must be valid ISO 8601 date'),
    body('estimate_hours').optional().isFloat({ min: 0, max: 10000 }).withMessage('Estimate hours must be between 0 and 10000'),
    body('assignees').optional().isArray({ max: 20 }).withMessage('Maximum 20 assignees allowed'),
    body('assignees.*').isString().withMessage('Each assignee must be a user ID string')
  ],

  update: [
    body('title').optional().isString().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('description').optional().isString().isLength({ max: 10000 }).withMessage('Description must be less than 10000 characters'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
    body('status').optional().isIn(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELED']).withMessage('Invalid status'),
    body('start_date').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    body('due_date').optional().isISO8601().withMessage('Due date must be valid ISO 8601 date'),
    body('estimate_hours').optional().isFloat({ min: 0, max: 10000 }).withMessage('Estimate hours must be between 0 and 10000')
  ],

  worklog: [
    body('content').isString().isLength({ min: 1, max: 1000 }).withMessage('Content must be 1-1000 characters'),
    body('spent_minutes').isInt({ min: 1, max: 1440 }).withMessage('Spent minutes must be between 1 and 1440')
  ],

  comment: [
    body('content').isString().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters')
  ],

  assignee: [
    body('user_id').isString().withMessage('User ID required')
  ],

  statusChange: [
    body('to_status').isIn(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELED']).withMessage('Invalid status'),
    body('note').optional().isString().isLength({ max: 500 }).withMessage('Note must be less than 500 characters')
  ]
};

/**
 * Evaluation validation rules
 */
const evaluationRules = {
  manager: [
    body('score_percent').isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
    body('summary').isString().isLength({ min: 1, max: 1000 }).withMessage('Summary must be 1-1000 characters')
  ],

  ai: [
    body('context_payload').isObject().withMessage('Context payload must be an object')
  ]
};

/**
 * Billing validation rules
 */
const billingRules = {
  subscribe: [
    body('plan_id').isString().withMessage('Plan ID required')
  ],

  confirmPayment: [
    body('payment_id').isString().withMessage('Payment ID required'),
    body('evidence').optional().isString().withMessage('Evidence must be a string')
  ],

  cancellation: [
    body('reason').isString().isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters')
  ]
};

/**
 * Ticket validation rules
 */
const ticketRules = {
  create: [
    body('subject').isString().isLength({ min: 1, max: 200 }).withMessage('Subject must be 1-200 characters'),
    body('content').isString().isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority')
  ],

  message: [
    body('content').isString().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters')
  ]
};

module.exports = {
  handleValidationErrors,
  commonRules,
  authRules,
  groupRules,
  teamRules,
  projectRules,
  taskRules,
  evaluationRules,
  billingRules,
  ticketRules
};
