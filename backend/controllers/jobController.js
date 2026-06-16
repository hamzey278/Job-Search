const JobModel = require('../models/jobModel');
const AuditModel = require('../models/auditModel');
const logger = require('../config/logger');

const JobController = {
  /**
   * Create a new job posting.
   */
  async create(req, res) {
    try {
      const { title, description, location, employment_type, salary_range } = req.body;

      if (!title || !description || !location || !employment_type) {
        return res.status(400).json({ error: 'Title, description, location, and employment type are required' });
      }

      const allowedTypes = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'];
      if (!allowedTypes.includes(employment_type)) {
        return res.status(400).json({ error: 'Invalid employment type specified' });
      }

      const job = await JobModel.create({
        title,
        description,
        location,
        employment_type,
        salary_range,
        created_by: req.user.userId
      });

      // Audit Log
      await AuditModel.create({
        user_id: req.user.userId,
        action: 'JOB_CREATION',
        resource: `JOBS/${job.id}`,
        ip_address: req.ip
      });

      logger.info(`Job created: "${title}" by recruiter ${req.user.email}`);

      return res.status(201).json({
        message: 'Job posting created successfully',
        job
      });
    } catch (err) {
      logger.error('Job creation controller error', err);
      return res.status(500).json({ error: 'Server error creating job posting' });
    }
  },

  /**
   * Update an existing job.
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, description, location, employment_type, salary_range, status } = req.body;

      const job = await JobModel.findById(id);
      if (!job) {
        return res.status(404).json({ error: 'Job posting not found' });
      }

      // Enforce ownership: only owner recruiter or Admin can modify
      if (req.user.role !== 'Admin' && job.created_by !== req.user.userId) {
        logger.logSecurity('Unauthorized Job Edit Attempt', req.user.userId, req.ip, { jobId: id });
        return res.status(403).json({ error: 'Forbidden: You do not own this job posting' });
      }

      const updatedJob = await JobModel.update(id, {
        title: title || job.title,
        description: description || job.description,
        location: location || job.location,
        employment_type: employment_type || job.employment_type,
        salary_range: salary_range || job.salary_range,
        status: status || job.status
      });

      logger.info(`Job updated: "${updatedJob.title}" by user ${req.user.email}`);

      return res.status(200).json({
        message: 'Job posting updated successfully',
        job: updatedJob
      });
    } catch (err) {
      logger.error('Job update controller error', err);
      return res.status(500).json({ error: 'Server error updating job posting' });
    }
  },

  /**
   * Delete a job posting.
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const job = await JobModel.findById(id);
      if (!job) {
        return res.status(404).json({ error: 'Job posting not found' });
      }

      // Enforce ownership: only owner recruiter or Admin can delete
      if (req.user.role !== 'Admin' && job.created_by !== req.user.userId) {
        logger.logSecurity('Unauthorized Job Deletion Attempt', req.user.userId, req.ip, { jobId: id });
        return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this job' });
      }

      await JobModel.delete(id);

      // Audit Log
      await AuditModel.create({
        user_id: req.user.userId,
        action: 'JOB_DELETION',
        resource: `JOBS/${id}`,
        ip_address: req.ip
      });

      logger.info(`Job deleted: ${id} by user ${req.user.email}`);

      return res.status(200).json({ message: 'Job posting deleted successfully' });
    } catch (err) {
      logger.error('Job deletion controller error', err);
      return res.status(500).json({ error: 'Server error deleting job posting' });
    }
  },

  /**
   * Get job by ID.
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const job = await JobModel.findById(id);
      if (!job) {
        return res.status(404).json({ error: 'Job posting not found' });
      }
      return res.status(200).json({ job });
    } catch (err) {
      logger.error('Get job by ID error', err);
      return res.status(500).json({ error: 'Server error fetching job details' });
    }
  },

  /**
   * Get all active (Open) jobs with dynamic filters and pagination.
   */
  async getAll(req, res) {
    try {
      const { search, location, employment_type, status, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

      const parsedPage = Math.max(1, parseInt(page));
      const parsedLimit = Math.max(1, Math.min(100, parseInt(limit)));
      const offset = (parsedPage - 1) * parsedLimit;

      const result = await JobModel.findAll({
        search,
        location,
        employment_type,
        status: status !== undefined ? status : 'Open', // Defaults to Open unless requested
        limit: parsedLimit,
        offset,
        sortBy,
        sortOrder
      });

      return res.status(200).json({
        ...result,
        page: parsedPage,
        limit: parsedLimit
      });
    } catch (err) {
      logger.error('Get all jobs error', err);
      return res.status(500).json({ error: 'Server error fetching job list' });
    }
  }
};

module.exports = JobController;
