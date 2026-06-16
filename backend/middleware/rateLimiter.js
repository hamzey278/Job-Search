const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * IP-based Rate Limiter for Authentication routes (Login, Register).
 * Restricts brute-force attempts on credentials.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 attempts per IP per 15-minute window
  message: {
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  handler: (req, res, next, options) => {
    logger.logSecurity('IP Auth Rate Limit Exceeded', null, req.ip, {
      path: req.originalUrl
    });
    res.status(429).json(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * IP-based Rate Limiter for general API endpoints.
 * Standard denial of service protection.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Max 150 requests per IP per 15 minutes
  message: {
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter
};
