const db = require('../config/db');

const ResumeModel = {
  /**
   * Add a new resume reference.
   */
  async create({ user_id, file_name, file_url }) {
    const query = `
      INSERT INTO resumes (user_id, file_name, file_url)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await db.query(query, [user_id, file_name, file_url]);
    return rows[0];
  },

  /**
   * Find all resumes for a specific candidate.
   */
  async findByUserId(userId) {
    const query = `
      SELECT * FROM resumes 
      WHERE user_id = $1 
      ORDER BY uploaded_at DESC
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  }
};

module.exports = ResumeModel;
