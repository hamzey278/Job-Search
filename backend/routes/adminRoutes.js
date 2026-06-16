const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

// Force JWT check and restrict access strictly to Admin users
router.use(authenticateJWT, authorizeRoles('Admin'));

// Admin API endpoints
router.get('/users', AdminController.getUsers);
router.put('/users/:id/status', AdminController.updateUserStatus);
router.get('/audit-logs', AdminController.getAuditLogs);

module.exports = router;
