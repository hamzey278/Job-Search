const db = require('../config/db');

const UserModel = {
  /**
   * Find a user by their email address.
   * Parameterized to prevent SQL injection.
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email.toLowerCase().trim()]);
    return rows[0] || null;
  },

  /**
   * Find a user by their ID.
   */
  async findById(id) {
    const query = 'SELECT id, full_name, email, role, failed_login_attempts, account_locked_until, is_active, created_at, updated_at FROM users WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Create a new user with standard/custom roles.
   */
  async createUser(fullName, email, passwordHash, role = 'Candidate') {
    const query = `
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, role, created_at
    `;
    const { rows } = await db.query(query, [
      fullName.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      role
    ]);
    return rows[0];
  },

  /**
   * Increment failed login attempts count.
   */
  async incrementFailedAttempts(email) {
    const query = `
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
      RETURNING failed_login_attempts
    `;
    const { rows } = await db.query(query, [email.toLowerCase().trim()]);
    return rows[0] ? rows[0].failed_login_attempts : 0;
  },

  /**
   * Reset failed attempts count to 0 and unlock.
   */
  async resetFailedAttempts(email) {
    const query = `
      UPDATE users
      SET failed_login_attempts = 0,
          account_locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
    `;
    await db.query(query, [email.toLowerCase().trim()]);
  },

  /**
   * Lock a user account until a specific timestamp.
   */
  async lockAccount(email, lockUntil) {
    const query = `
      UPDATE users
      SET account_locked_until = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
    `;
    await db.query(query, [lockUntil, email.toLowerCase().trim()]);
  },

  /**
   * Fetch all users (Admin dashboard view).
   */
  async findAll() {
    const query = 'SELECT id, full_name, email, role, is_active, failed_login_attempts, account_locked_until, created_at FROM users ORDER BY created_at DESC';
    const { rows } = await db.query(query);
    return rows;
  },

  /**
   * Update user details or active status (Admin function).
   */
  async updateStatus(id, isActive, role) {
    const query = `
      UPDATE users
      SET is_active = $1,
          role = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, full_name, email, role, is_active
    `;
    const { rows } = await db.query(query, [isActive, role, id]);
    return rows[0] || null;
  }
};

module.exports = UserModel;
