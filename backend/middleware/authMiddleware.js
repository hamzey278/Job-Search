const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Middleware to authenticate requests via JWT.
 * Expects header: Authorization: Bearer <token>
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: Missing or malformed token header', {
      ip: req.ip,
      path: req.originalUrl
    });
    return res.status(401).json({ error: 'Access token is required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_key_8e4fa694c9ef294b');
    
    // Store user data on request context
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (err) {
    logger.warn('Authentication failed: Invalid token', {
      ip: req.ip,
      path: req.originalUrl,
      error: err.message
    });
    return res.status(403).json({ error: 'Session expired or invalid token' });
  }
};

/**
 * Middleware to authorize roles.
 * @param {...string} allowedRoles - List of permitted roles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.error('RBAC middleware executed without prior authentication');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { role, userId } = req.user;

    if (!allowedRoles.includes(role)) {
      // Log security infraction
      logger.logSecurity('Permission Denied', userId, req.ip, {
        role,
        requiredRoles: allowedRoles,
        path: req.originalUrl,
        method: req.method
      });

      return res.status(403).json({ 
        error: 'Forbidden: You do not have permission to access this resource' 
      });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles
};
