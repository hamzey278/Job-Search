const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadResume, validateUpload } = require('../middleware/uploadMiddleware');

// Public endpoints (rate limited)
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);

// Private endpoints
router.get('/profile', authenticateJWT, AuthController.profile);
router.post('/profile/resume', authenticateJWT, authorizeRoles('Candidate'), uploadResume, validateUpload, AuthController.uploadResume);

module.exports = router;
