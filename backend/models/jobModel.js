const db = require('../config/db');

const JobModel = {
  /**
   * Create a new job posting.
   */
  async create({ title, description, location, employment_type, salary_range, created_by }) {
    const query = `
      INSERT INTO jobs (title, description, location, employment_type, salary_range, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      title.trim(),
      description.trim(),
      location.trim(),
      employment_type,
      salary_range ? salary_range.trim() : null,
      created_by
    ]);
    return rows[0];
  },

  /**
   * Update an existing job.
   */
  async update(id, { title, description, location, employment_type, salary_range, status }) {
    const query = `
      UPDATE jobs
      SET title = $1,
          description = $2,
          location = $3,
          employment_type = $4,
          salary_range = $5,
          status = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      title.trim(),
      description.trim(),
      location.trim(),
      employment_type,
      salary_range ? salary_range.trim() : null,
      status,
      id
    ]);
    return rows[0] || null;
  },

  /**
   * Delete a job posting (Admin feature).
   */
  async delete(id) {
    const query = 'DELETE FROM jobs WHERE id = $1 RETURNING id';
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Retrieve a job by its ID, joining the creator recruiter profile.
   */
  async findById(id) {
    const query = `
      SELECT j.*, u.full_name as recruiter_name, u.email as recruiter_email
      FROM jobs j
      LEFT JOIN users u ON j.created_by = u.id
      WHERE j.id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Retrieve filtered, sorted, paginated jobs.
   */
  async findAll({ search, location, employment_type, status = 'Open', limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' }) {
    let queryText = `
      SELECT j.*, u.full_name as recruiter_name, COALESCE(count(a.id)::int, 0) as application_count
      FROM jobs j
      LEFT JOIN users u ON j.created_by = u.id
      LEFT JOIN applications a ON j.id = a.job_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (status) {
      params.push(status);
      conditions.push(`j.status = $${params.length}`);
    }
    
    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`);
    }
    
    if (location) {
      params.push(`%${location.trim()}%`);
      conditions.push(`j.location ILIKE $${params.length}`);
    }
    
    if (employment_type) {
      params.push(employment_type);
      conditions.push(`j.employment_type = $${params.length}`);
    }
    
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    
    queryText += ' GROUP BY j.id, u.full_name';
    
    // Whitelist sorting inputs to prevent query manipulation
    const allowedSortFields = ['created_at', 'title', 'location'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    queryText += ` ORDER BY j.${finalSortBy} ${finalSortOrder}`;
    
    // Add pagination params
    params.push(limit);
    queryText += ` LIMIT $${params.length}`;
    
    params.push(offset);
    queryText += ` OFFSET $${params.length}`;
    
    const { rows } = await db.query(queryText, params);
    
    // Get total count for metadata
    let countQueryText = 'SELECT count(*) FROM jobs j';
    const countParams = [];
    const countConditions = [];
    
    if (status) {
      countParams.push(status);
      countConditions.push(`j.status = $${countParams.length}`);
    }
    if (search) {
      countParams.push(`%${search.trim()}%`);
      countConditions.push(`(j.title ILIKE $${countParams.length} OR j.description ILIKE $${countParams.length})`);
    }
    if (location) {
      countParams.push(`%${location.trim()}%`);
      countConditions.push(`j.location ILIKE $${countParams.length}`);
    }
    if (employment_type) {
      countParams.push(employment_type);
      countConditions.push(`j.employment_type = $${countParams.length}`);
    }
    
    if (countConditions.length > 0) {
      countQueryText += ' WHERE ' + countConditions.join(' AND ');
    }
    
    const countRes = await db.query(countQueryText, countParams);
    const totalCount = parseInt(countRes.rows[0].count);
    
    return {
      jobs: rows,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    };
  }
};

module.exports = JobModel;
