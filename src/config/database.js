const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Build DATABASE_URL from individual environment variables
const buildDatabaseConfig = () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'progressmark';
  
  return {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
};

// Create connection pool
const config = buildDatabaseConfig();
const pool = mysql.createPool(config);

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logger.info('Database connected successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Database helper class
class Database {
  constructor() {
    this.pool = pool;
  }

  // Get connection from pool
  async getConnection() {
    return await this.pool.getConnection();
  }

  // Execute query with parameters
  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      logger.error('Database query error:', { sql, params, error: error.message });
      throw error;
    }
  }

  // Execute transaction
  async transaction(callback) {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Close all connections
  async close() {
    await this.pool.end();
  }
}

// Create database instance
const db = new Database();

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.close();
});

process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});

// Test connection on startup
testConnection();

module.exports = db;