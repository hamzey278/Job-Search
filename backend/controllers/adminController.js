const UserModel = require('../models/userModel');
const AuditModel = require('../models/auditModel');
const logger = require('../config/logger');

const AdminController = {
  /**
   * Get all registered users (Admin view).
   */
  async getUsers(req, res) {
    try {
      const users = await UserModel.findAll();
      return res.status(200).json({ users });
    } catch (err) {
      logger.error('Admin getUsers controller error', err);
      return res.status(500).json({ error: 'Server error retrieving users list' });
    }
  },

  /**
   * Enable/Disable accounts or change roles (Admin function).
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active, role } = req.body;

      if (is_active === undefined || !role) {
        return res.status(400).json({ error: 'is_active status and role are required' });
      }

      const allowedRoles = ['Candidate', 'Recruiter', 'Admin'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role selection' });
      }

      // Safeguard: Prevent disabling self
      if (id === req.user.userId) {
        return res.status(400).json({ error: 'Self-administration limit: You cannot disable or modify your own active admin account' });
      }

      const updatedUser = await UserModel.updateStatus(id, is_active, role);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log & Audit administrative intervention
      const auditAction = is_active ? 'ADMIN_USER_ENABLE' : 'ADMIN_USER_DISABLE';
      await AuditModel.create({
        user_id: req.user.userId,
        action: auditAction,
        resource: `USERS/${id}`,
        ip_address: req.ip
      });

      logger.info(`Admin ${req.user.email} updated user ${id} (is_active: ${is_active}, role: ${role})`);

      return res.status(200).json({
        message: 'User account status updated successfully',
        user: updatedUser
      });
    } catch (err) {
      logger.error('Admin updateUserStatus error', err);
      return res.status(500).json({ error: 'Server error updating user status' });
    }
  },

  /**
   * Get audit trails.
   */
  async getAuditLogs(req, res) {
    try {
      const logs = await AuditModel.findAll();
      return res.status(200).json({ logs });
    } catch (err) {
      logger.error('Admin getAuditLogs error', err);
      return res.status(500).json({ error: 'Server error retrieving audit logs' });
    }
  }
};

module.exports = AdminController;
