const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'jobportal',
  max: 20, // Maximum client connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  logger.info('Database connection pool established successfully');
});

pool.on('error', (err) => {
  logger.error('Database pool encountered an unexpected error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
