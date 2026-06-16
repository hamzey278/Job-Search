const winston = require('winston');
const path = require('path');

// Custom format for JSON file logs
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom format for local console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let msg = `[${timestamp}] ${level}: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      msg += `\n${stack}`;
    }
    return msg;
  })
);

// Define log directory inside backend
const logDir = path.join(__dirname, '../logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }),
    // Security audit logs (warnings and errors represent security alerts)
    new winston.transports.File({ 
      filename: path.join(logDir, 'security.log'), 
      level: 'warn' 
    })
  ]
});

// If not in production, log to console with clean formatting
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Security event logging wrapper
logger.logSecurity = (action, userId, ipAddress, details = {}) => {
  logger.warn(`Security event: ${action}`, {
    security: true,
    action,
    userId,
    ipAddress,
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
