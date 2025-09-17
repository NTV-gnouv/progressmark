const prisma = require('../config/database');
const { processPaginationParams, buildCursorWhere, buildOrderBy, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

class GroupService {
  /**
   * Get user's groups
   */
  async getUserGroups(userId, query = {}) {
    const pagination = processPaginationParams(query);
    
    const where = {
      members: {
        some: { userId }
      }
    };

    const groups = await prisma.group.findMany({
      where,
      orderBy: buildOrderBy(pagination.primarySortField, pagination.primarySortOrder),
      take: pagination.limit + 1,
      skip: pagination.cursor ? 1 : 0,
      cursor: pagination.cursor ? {
        id: JSON.parse(Buffer.from(pagination.cursor, 'base64').toString()).id
      } : undefined,
      include: {
        _count: {
          select: {
            members: true,
            teams: true,
            projects: true
          }
        }
      }
    });

    const hasNextPage = groups.length > pagination.limit;
    if (hasNextPage) groups.pop();

    const meta = buildPaginationMeta(groups, pagination.limit, pagination.primarySortField, pagination.primarySortOrder);

    return { groups, meta };
  }

  /**
   * Get group by ID
   */
  async getGroupById(groupId, userId) {
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: { userId }
        }
      },
      include: {
        _count: {
          select: {
            members: true,
            teams: true,
            projects: true
          }
        }
      }
    });

    if (!group) {
      throw new Error('Group not found');
    }

    return group;
  }

  /**
   * Create new group
   */
  async createGroup(groupData, userId) {
    const { name, slug, color } = groupData;

    // Check if slug is unique
    const existingGroup = await prisma.group.findUnique({
      where: { slug }
    });

    if (existingGroup) {
      throw new Error('Slug already exists');
    }

    // Create group
    const group = await prisma.group.create({
      data: {
        name,
        slug,
        color,
        createdBy: userId
      },
      include: {
        _count: {
          select: {
            members: true,
            teams: true,
            projects: true
          }
        }
      }
    });

    // Add creator as owner
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: userId,
        role: 'OWNER'
      }
    });

    return group;
  }

  /**
   * Update group
   */
  async updateGroup(groupId, updateData, userId) {
    // Check if user has permission to update group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new Error('Insufficient permissions');
    }

    // Check slug uniqueness if being updated
    if (updateData.slug) {
      const existingGroup = await prisma.group.findFirst({
        where: {
          slug: updateData.slug,
          id: { not: groupId }
        }
      });

      if (existingGroup) {
        throw new Error('Slug already exists');
      }
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: updateData,
      include: {
        _count: {
          select: {
            members: true,
            teams: true,
            projects: true
          }
        }
      }
    });

    return group;
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId, userId) {
    // Check if user is owner
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership || membership.role !== 'OWNER') {
      throw new Error('Only group owner can delete group');
    }

    await prisma.group.delete({
      where: { id: groupId }
    });

    return { success: true };
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId, query = {}) {
    const pagination = processPaginationParams(query);
    
    const where = {
      groupId,
      ...(query.role && { role: query.role })
    };

    const members = await prisma.groupMember.findMany({
      where,
      orderBy: buildOrderBy(pagination.primarySortField, pagination.primarySortOrder),
      take: pagination.limit + 1,
      skip: pagination.cursor ? 1 : 0,
      cursor: pagination.cursor ? {
        id: JSON.parse(Buffer.from(pagination.cursor, 'base64').toString()).id
      } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true
          }
        }
      }
    });

    const hasNextPage = members.length > pagination.limit;
    if (hasNextPage) members.pop();

    const meta = buildPaginationMeta(members, pagination.limit, pagination.primarySortField, pagination.primarySortOrder);

    return { members, meta };
  }

  /**
   * Add member to group
   */
  async addGroupMember(groupId, memberData, userId) {
    // Check if user has permission to add members
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new Error('Insufficient permissions');
    }

    const { user_id, email, role } = memberData;

    let targetUserId = user_id;

    // If email provided, find user by email
    if (!user_id && email) {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      targetUserId = user.id;
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId
        }
      }
    });

    if (existingMember) {
      throw new Error('User is already a member');
    }

    // Add member
    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUserId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true
          }
        }
      }
    });

    return member;
  }

  /**
   * Update member role
   */
  async updateMemberRole(groupId, memberId, role, userId) {
    // Check if user has permission to update members
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new Error('Insufficient permissions');
    }

    // Prevent owner from changing their own role
    if (membership.role === 'OWNER' && membership.userId === memberId) {
      throw new Error('Cannot change owner role');
    }

    const member = await prisma.groupMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true
          }
        }
      }
    });

    return member;
  }

  /**
   * Remove member from group
   */
  async removeGroupMember(groupId, memberId, userId) {
    // Check if user has permission to remove members
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new Error('Insufficient permissions');
    }

    // Prevent owner from removing themselves
    if (membership.role === 'OWNER' && membership.userId === memberId) {
      throw new Error('Cannot remove group owner');
    }

    await prisma.groupMember.delete({
      where: { id: memberId }
    });

    return { success: true };
  }
}

module.exports = new GroupService();
