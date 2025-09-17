const { Group, GroupMember } = require('../models');
const logger = require('../utils/logger');

class GroupService {
  /**
   * Get user's groups
   */
  async getUserGroups(userId, query = {}) {
    try {
      const groups = await GroupMember.getUserGroups(userId);
      
      const meta = {
        total: groups.length,
        hasNextPage: false,
        nextCursor: null
      };

      return {
        groups,
        meta
      };
    } catch (error) {
      logger.error('Error getting user groups:', error);
      throw error;
    }
  }

  /**
   * Get group by ID
   */
  async getGroupById(groupId, userId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is member of this group
      const membership = await GroupMember.findByUserAndGroup(userId, groupId);
      if (!membership) {
        throw new Error('Access denied');
      }

      return group;
    } catch (error) {
      logger.error('Error getting group by ID:', error);
      throw error;
    }
  }

  /**
   * Create new group
   */
  async createGroup(groupData, creatorId) {
    try {
      const group = await Group.createGroup({
        name: groupData.name,
        slug: groupData.slug || groupData.name.toLowerCase().replace(/\s+/g, '-'),
        color: groupData.color,
        createdBy: creatorId
      });

      // Add creator as admin
      await GroupMember.addMember(group.id, creatorId, 'ADMIN');

      logger.info('Group created successfully', { groupId: group.id, creatorId });
      return group;
    } catch (error) {
      logger.error('Error creating group:', error);
      throw error;
    }
  }

  /**
   * Update group
   */
  async updateGroup(groupId, updateData, userId) {
    try {
      // Check if user is admin of this group
      const membership = await GroupMember.findByUserAndGroup(userId, groupId);
      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Access denied');
      }

      const group = await Group.update(groupId, {
        ...updateData,
        updatedAt: new Date()
      });

      if (!group) {
        throw new Error('Group not found');
      }

      logger.info('Group updated successfully', { groupId });
      return group;
    } catch (error) {
      logger.error('Error updating group:', error);
      throw error;
    }
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId, userId) {
    try {
      // Check if user is admin of this group
      const membership = await GroupMember.findByUserAndGroup(userId, groupId);
      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Access denied');
      }

      const result = await Group.delete(groupId);
      logger.info('Group deleted successfully', { groupId });
      return result;
    } catch (error) {
      logger.error('Error deleting group:', error);
      throw error;
    }
  }

  /**
   * Add member to group
   */
  async addMember(groupId, userId, role = 'MEMBER', adminId) {
    try {
      // Check if admin has permission
      const adminMembership = await GroupMember.findByUserAndGroup(adminId, groupId);
      if (!adminMembership || adminMembership.role !== 'ADMIN') {
        throw new Error('Access denied');
      }

      const membership = await GroupMember.addMember(groupId, userId, role);
      logger.info('Member added to group', { groupId, userId, role });
      return membership;
    } catch (error) {
      logger.error('Error adding member to group:', error);
      throw error;
    }
  }

  /**
   * Remove member from group
   */
  async removeMember(groupId, userId, adminId) {
    try {
      // Check if admin has permission
      const adminMembership = await GroupMember.findByUserAndGroup(adminId, groupId);
      if (!adminMembership || adminMembership.role !== 'ADMIN') {
        throw new Error('Access denied');
      }

      const membership = await GroupMember.findByUserAndGroup(userId, groupId);
      if (!membership) {
        throw new Error('Member not found');
      }

      await GroupMember.delete(membership.id);
      logger.info('Member removed from group', { groupId, userId });
      return true;
    } catch (error) {
      logger.error('Error removing member from group:', error);
      throw error;
    }
  }
}

module.exports = new GroupService();