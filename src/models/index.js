const db = require('../config/database');
const logger = require('../utils/logger');

// Base model class
class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // Find all records
  async findAll(where = {}, options = {}) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key]);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    return await db.query(sql, params);
  }

  // Find one record
  async findOne(where = {}) {
    const results = await this.findAll(where, { limit: 1 });
    return results[0] || null;
  }

  // Find by ID
  async findById(id) {
    return await this.findOne({ id });
  }

  // Create record
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');

    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await db.query(sql, values);
    
    return {
      id: result.insertId,
      ...data
    };
  }

  // Update record
  async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    await db.query(sql, [...values, id]);
    
    return await this.findById(id);
  }

  // Delete record
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await db.query(sql, [id]);
    return true;
  }

  // Count records
  async count(where = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key]);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await db.query(sql, params);
    return result[0].count;
  }
}

// User model
class User extends BaseModel {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async createUser(userData) {
    return await this.create({
      id: userData.id || require('crypto').randomUUID(),
      email: userData.email,
      name: userData.name,
      password: userData.password,
      status: userData.status || 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

// Group model
class Group extends BaseModel {
  constructor() {
    super('groups');
  }

  async findBySlug(slug) {
    return await this.findOne({ slug });
  }

  async createGroup(groupData) {
    return await this.create({
      id: groupData.id || require('crypto').randomUUID(),
      name: groupData.name,
      slug: groupData.slug,
      color: groupData.color,
      createdBy: groupData.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

// GroupMember model
class GroupMember extends BaseModel {
  constructor() {
    super('group_members');
  }

  async findByUserAndGroup(userId, groupId) {
    return await this.findOne({ userId, groupId });
  }

  async getUserGroups(userId) {
    const sql = `
      SELECT g.*, gm.role, gm.joinedAt 
      FROM groups g 
      JOIN group_members gm ON g.id = gm.groupId 
      WHERE gm.userId = ?
      ORDER BY gm.joinedAt DESC
    `;
    return await db.query(sql, [userId]);
  }

  async addMember(groupId, userId, role) {
    return await this.create({
      id: require('crypto').randomUUID(),
      groupId,
      userId,
      role,
      joinedAt: new Date()
    });
  }
}

// Task model
class Task extends BaseModel {
  constructor() {
    super('tasks');
  }

  async getProjectTasks(projectId, options = {}) {
    let sql = `
      SELECT t.*, 
             u.name as creator_name, 
             u.email as creator_email,
             COUNT(DISTINCT w.id) as worklog_count,
             COUNT(DISTINCT c.id) as comment_count,
             COUNT(DISTINCT a.id) as attachment_count
      FROM tasks t
      LEFT JOIN users u ON t.creatorId = u.id
      LEFT JOIN worklogs w ON t.id = w.taskId
      LEFT JOIN comments c ON t.id = c.taskId
      LEFT JOIN attachments a ON t.id = a.taskId
      WHERE t.projectId = ?
    `;
    const params = [projectId];

    if (options.status) {
      sql += ` AND t.status IN (${options.status.split(',').map(() => '?').join(',')})`;
      params.push(...options.status.split(','));
    }

    if (options.priority) {
      sql += ` AND t.priority IN (${options.priority.split(',').map(() => '?').join(',')})`;
      params.push(...options.priority.split(','));
    }

    if (options.q) {
      sql += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      const searchTerm = `%${options.q}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ` GROUP BY t.id`;

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    } else {
      sql += ` ORDER BY t.createdAt DESC`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    return await db.query(sql, params);
  }
}

// Export models
module.exports = {
  User,
  Group,
  GroupMember,
  Task,
  BaseModel
};
