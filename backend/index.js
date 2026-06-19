require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./config/logger');
const metrics = require('./config/metrics');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. HELMET SECURITY HEADERS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "http://localhost:5000"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS CONFIGURATION
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// 3. BODY PARSING MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. REQUEST LOGGING & PROMETHEUS METRICS COLLECTION
app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  res.on('finish', () => {
    // Record request count and labels for Prometheus monitoring
    metrics.httpRequestsTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.baseUrl + req.path,
      status: res.statusCode
    });
  });
  
  next();
});

// 5. STATIC UPLOADS DIR FOR RESUMES (Dev only fallback)
app.use('/uploads', express.static(process.env.UPLOADS_PATH || path.join(__dirname, '../uploads')));

// 6. PROMETHEUS METRICS ENDPOINT
app.get('/metrics', async (req, res) => {
  try {
    res.setHeader('Content-Type', metrics.register.contentType);
    res.send(await metrics.register.metrics());
  } catch (err) {
    logger.error('Error fetching metrics', err);
    res.status(500).end(err);
  }
});

// 7. HEALTHCHECK
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// 8. API ROUTES MOUNT
app.use('/api/auth', authRoutes);
app.use('/api/jobs', apiLimiter, jobRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// 9. 404 NOT FOUND HANDLER
app.use((req, res) => {
  res.status(404).json({ error: 'Resource not found' });
});

// 10. GLOBAL SANITIZED ERROR HANDLER
app.use((err, req, res, next) => {
  logger.error('Unhandled internal application error', err);
  
  const status = err.status || err.statusCode || 500;
  const errorResponse = {
    error: 'An unexpected database or application error occurred.'
  };

  // Hide detailed stacks in production environments to prevent leaks
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.details = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(status).json(errorResponse);
});

// START EXPRESS SERVER
app.listen(PORT, () => {
  logger.info(`Secure Job Portal Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
