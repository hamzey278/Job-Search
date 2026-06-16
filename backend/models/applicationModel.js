const db = require('../config/db');

const ApplicationModel = {
  /**
   * Create a new job application.
   */
  async create({ job_id, candidate_id, resume_url, cover_letter }) {
    const query = `
      INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      job_id,
      candidate_id,
      resume_url,
      cover_letter ? cover_letter.trim() : null
    ]);
    return rows[0];
  },

  /**
   * Retrieve a specific application by its ID.
   */
  async findById(id) {
    const query = `
      SELECT a.*, j.title as job_title, j.created_by as recruiter_id, u.full_name as candidate_name, u.email as candidate_email
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN users u ON a.candidate_id = u.id
      WHERE a.id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Get all applications submitted by a specific candidate.
   */
  async findByCandidate(candidateId) {
    const query = `
      SELECT a.*, j.title as job_title, j.location, j.employment_type, j.status as job_status
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.candidate_id = $1
      ORDER BY a.applied_at DESC
    `;
    const { rows } = await db.query(query, [candidateId]);
    return rows;
  },

  /**
   * Get all applications for a specific job.
   */
  async findByJob(jobId) {
    const query = `
      SELECT a.*, u.full_name as candidate_name, u.email as candidate_email
      FROM applications a
      JOIN users u ON a.candidate_id = u.id
      WHERE a.job_id = $1
      ORDER BY a.applied_at DESC
    `;
    const { rows } = await db.query(query, [jobId]);
    return rows;
  },

  /**
   * Get all applications submitted to jobs created by a recruiter.
   */
  async findByRecruiter(recruiterId) {
    const query = `
      SELECT a.*, j.title as job_title, u.full_name as candidate_name, u.email as candidate_email
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.candidate_id = u.id
      WHERE j.created_by = $1
      ORDER BY a.applied_at DESC
    `;
    const { rows } = await db.query(query, [recruiterId]);
    return rows;
  },

  /**
   * Update the status of an application.
   */
  async updateStatus(id, status) {
    const query = `
      UPDATE applications
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await db.query(query, [status, id]);
    return rows[0] || null;
  }
};

module.exports = ApplicationModel;
