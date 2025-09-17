const { error } = require('../utils/response');

/**
 * 404 Not Found middleware
 */
const notFound = (req, res) => {
  return error.notFound(res, `Route ${req.method} ${req.path} not found`);
};

module.exports = { notFound };
