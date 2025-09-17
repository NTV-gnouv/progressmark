const groupService = require('../services/groupService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

class GroupController {
  /**
   * Get user's groups
   */
  async getUserGroups(req, res) {
    try {
      const userId = req.user.id;
      const result = await groupService.getUserGroups(userId, req.query);

      return success.ok(res, { groups: result.groups }, result.meta);
    } catch (err) {
      logger.error('Get user groups failed:', err);
      return error.internal(res, 'Failed to get groups');
    }
  }

  /**
   * Get group by ID
   */
  async getGroupById(req, res) {
    try {
      const { gid } = req.params;
      const userId = req.user.id;

      const group = await groupService.getGroupById(gid, userId);

      return success.ok(res, group);
    } catch (err) {
      logger.error('Get group failed:', err);
      
      if (err.message === 'Group not found') {
        return error.notFound(res, 'Group not found');
      }
      
      return error.internal(res, 'Failed to get group');
    }
  }

  /**
   * Create new group
   */
  async createGroup(req, res) {
    try {
      const userId = req.user.id;
      const groupData = req.body;

      const group = await groupService.createGroup(groupData, userId);

      logger.info('Group created successfully', { groupId: group.id, userId });

      return success.created(res, group);
    } catch (err) {
      logger.error('Create group failed:', err);
      
      if (err.message === 'Slug already exists') {
        return error.conflict(res, 'Group slug already exists');
      }
      
      return error.internal(res, 'Failed to create group');
    }
  }

  /**
   * Update group
   */
  async updateGroup(req, res) {
    try {
      const { gid } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const group = await groupService.updateGroup(gid, updateData, userId);

      logger.info('Group updated successfully', { groupId: gid, userId });

      return success.ok(res, group);
    } catch (err) {
      logger.error('Update group failed:', err);
      
      if (err.message === 'Insufficient permissions') {
        return error.forbidden(res, 'Insufficient permissions to update group');
      }
      
      if (err.message === 'Slug already exists') {
        return error.conflict(res, 'Group slug already exists');
      }
      
      return error.internal(res, 'Failed to update group');
    }
  }

  /**
   * Delete group
   */
  async deleteGroup(req, res) {
    try {
      const { gid } = req.params;
      const userId = req.user.id;

      await groupService.deleteGroup(gid, userId);

      logger.info('Group deleted successfully', { groupId: gid, userId });

      return success.noContent(res);
    } catch (err) {
      logger.error('Delete group failed:', err);
      
      if (err.message === 'Only group owner can delete group') {
        return error.forbidden(res, 'Only group owner can delete group');
      }
      
      return error.internal(res, 'Failed to delete group');
    }
  }

  /**
   * Get group members
   */
  async getGroupMembers(req, res) {
    try {
      const { gid } = req.params;
      const result = await groupService.getGroupMembers(gid, req.query);

      return success.ok(res, { members: result.members }, result.meta);
    } catch (err) {
      logger.error('Get group members failed:', err);
      return error.internal(res, 'Failed to get group members');
    }
  }

  /**
   * Add member to group
   */
  async addGroupMember(req, res) {
    try {
      const { gid } = req.params;
      const memberData = req.body;

      const member = await groupService.addGroupMember(gid, memberData, req.user.id);

      logger.info('Member added to group successfully', { groupId: gid, memberId: member.id });

      return success.created(res, member);
    } catch (err) {
      logger.error('Add group member failed:', err);
      
      if (err.message === 'Insufficient permissions') {
        return error.forbidden(res, 'Insufficient permissions to add members');
      }
      
      if (err.message === 'User not found') {
        return error.notFound(res, 'User not found');
      }
      
      if (err.message === 'User is already a member') {
        return error.conflict(res, 'User is already a member of this group');
      }
      
      return error.internal(res, 'Failed to add group member');
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(req, res) {
    try {
      const { gid, memberId } = req.params;
      const { role } = req.body;

      const member = await groupService.updateMemberRole(gid, memberId, role, req.user.id);

      logger.info('Member role updated successfully', { groupId: gid, memberId, role });

      return success.ok(res, member);
    } catch (err) {
      logger.error('Update member role failed:', err);
      
      if (err.message === 'Insufficient permissions') {
        return error.forbidden(res, 'Insufficient permissions to update member role');
      }
      
      if (err.message === 'Cannot change owner role') {
        return error.badRequest(res, 'Cannot change owner role');
      }
      
      return error.internal(res, 'Failed to update member role');
    }
  }

  /**
   * Remove member from group
   */
  async removeGroupMember(req, res) {
    try {
      const { gid, memberId } = req.params;

      await groupService.removeGroupMember(gid, memberId, req.user.id);

      logger.info('Member removed from group successfully', { groupId: gid, memberId });

      return success.noContent(res);
    } catch (err) {
      logger.error('Remove group member failed:', err);
      
      if (err.message === 'Insufficient permissions') {
        return error.forbidden(res, 'Insufficient permissions to remove members');
      }
      
      if (err.message === 'Cannot remove group owner') {
        return error.badRequest(res, 'Cannot remove group owner');
      }
      
      return error.internal(res, 'Failed to remove group member');
    }
  }
}

module.exports = new GroupController();
