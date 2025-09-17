const express = require('express');
const { groupController } = require('../controllers');
const { groupRules, commonRules, handleValidationErrors } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');
const { requireGroupRole } = require('../middleware/rbac');

const router = express.Router();

// Apply authentication to all group routes
router.use(verifyToken);

// GET /groups - Get user's groups
router.get('/',
  groupController.getUserGroups
);

// POST /groups - Create new group
router.post('/',
  groupRules.create,
  handleValidationErrors,
  groupController.createGroup
);

// GET /groups/:gid - Get group by ID
router.get('/:gid',
  commonRules.id,
  handleValidationErrors,
  groupController.getGroupById
);

// PATCH /groups/:gid - Update group
router.patch('/:gid',
  commonRules.id,
  groupRules.update,
  handleValidationErrors,
  requireGroupRole('ADMIN'),
  groupController.updateGroup
);

// DELETE /groups/:gid - Delete group
router.delete('/:gid',
  commonRules.id,
  handleValidationErrors,
  requireGroupRole('OWNER'),
  groupController.deleteGroup
);

// GET /groups/:gid/members - Get group members
router.get('/:gid/members',
  commonRules.id,
  handleValidationErrors,
  groupController.getGroupMembers
);

// POST /groups/:gid/members - Add member to group
router.post('/:gid/members',
  commonRules.id,
  groupRules.addMember,
  handleValidationErrors,
  requireGroupRole('ADMIN'),
  groupController.addGroupMember
);

// PATCH /groups/:gid/members/:memberId - Update member role
router.patch('/:gid/members/:memberId',
  commonRules.id,
  handleValidationErrors,
  requireGroupRole('ADMIN'),
  groupController.updateMemberRole
);

// DELETE /groups/:gid/members/:memberId - Remove member from group
router.delete('/:gid/members/:memberId',
  commonRules.id,
  handleValidationErrors,
  requireGroupRole('ADMIN'),
  groupController.removeGroupMember
);

module.exports = router;
