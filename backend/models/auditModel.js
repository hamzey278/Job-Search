const db = require('../config/db');

const AuditModel = {
  /**
   * Log an audit event.
   */
  async create({ user_id, action, resource, ip_address }) {
    const query = `
      INSERT INTO audit_logs (user_id, action, resource, ip_address)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      user_id || null,
      action,
      resource,
      ip_address || null
    ]);
    return rows[0];
  },

  /**
   * Retrieve latest audit logs (Admin only).
   */
  async findAll() {
    const query = `
      SELECT a.*, u.email as user_email, u.full_name as user_name, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
      LIMIT 200
    `;
    const { rows } = await db.query(query);
    return rows;
  }
};

module.exports = AuditModel;
