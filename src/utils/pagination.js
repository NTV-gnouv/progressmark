/**
 * Cursor-based pagination utilities
 */

/**
 * Generate cursor for pagination
 * @param {Object} item - Database item
 * @param {string} sortField - Field to sort by
 * @returns {string} Base64 encoded cursor
 */
const generateCursor = (item, sortField = 'createdAt') => {
  const cursorData = {
    id: item.id,
    [sortField]: item[sortField]
  };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
};

/**
 * Parse cursor for pagination
 * @param {string} cursor - Base64 encoded cursor
 * @returns {Object|null} Parsed cursor data
 */
const parseCursor = (cursor) => {
  try {
    if (!cursor) return null;
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

/**
 * Build pagination where clause for Prisma
 * @param {string} cursor - Cursor string
 * @param {string} sortField - Field to sort by
 * @param {string} sortOrder - 'asc' or 'desc'
 * @returns {Object} Where clause for Prisma
 */
const buildCursorWhere = (cursor, sortField = 'createdAt', sortOrder = 'desc') => {
  const cursorData = parseCursor(cursor);
  if (!cursorData) return {};

  const operator = sortOrder === 'desc' ? 'lt' : 'gt';
  return {
    [sortField]: {
      [operator]: cursorData[sortField]
    }
  };
};

/**
 * Build pagination orderBy for Prisma
 * @param {string} sortField - Field to sort by
 * @param {string} sortOrder - 'asc' or 'desc'
 * @returns {Array} OrderBy clause for Prisma
 */
const buildOrderBy = (sortField = 'createdAt', sortOrder = 'desc') => {
  return [
    { [sortField]: sortOrder },
    { id: 'asc' } // Secondary sort for consistent pagination
  ];
};

/**
 * Process pagination parameters from query
 * @param {Object} query - Express query object
 * @returns {Object} Pagination parameters
 */
const processPaginationParams = (query) => {
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const cursor = query.cursor || null;
  const sort = query.sort || '-createdAt';
  
  // Parse sort parameter (e.g., "-createdAt,title" -> [{createdAt: 'desc'}, {title: 'asc'}])
  const sortFields = sort.split(',').map(field => {
    const isDesc = field.startsWith('-');
    const fieldName = isDesc ? field.substring(1) : field;
    return { [fieldName]: isDesc ? 'desc' : 'asc' };
  });

  return {
    limit,
    cursor,
    sortFields,
    primarySortField: sortFields[0] ? Object.keys(sortFields[0])[0] : 'createdAt',
    primarySortOrder: sortFields[0] ? Object.values(sortFields[0])[0] : 'desc'
  };
};

/**
 * Build pagination metadata
 * @param {Array} items - Result items
 * @param {number} limit - Requested limit
 * @param {string} sortField - Primary sort field
 * @param {string} sortOrder - Primary sort order
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (items, limit, sortField, sortOrder) => {
  const meta = {
    limit,
    count: items.length
  };

  if (items.length === limit) {
    const lastItem = items[items.length - 1];
    meta.nextCursor = generateCursor(lastItem, sortField);
  }

  return meta;
};

module.exports = {
  generateCursor,
  parseCursor,
  buildCursorWhere,
  buildOrderBy,
  processPaginationParams,
  buildPaginationMeta
};
