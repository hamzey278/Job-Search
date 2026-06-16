const ApplicationModel = require('../models/applicationModel');
const JobModel = require('../models/jobModel');
const AuditModel = require('../models/auditModel');
const metrics = require('../config/metrics');
const logger = require('../config/logger');

const ApplicationController = {
  /**
   * Apply for a job (Candidate function).
   */
  async apply(req, res) {
    try {
      const { job_id, resume_url, cover_letter } = req.body;

      if (!job_id || !resume_url) {
        return res.status(400).json({ error: 'Job ID and Resume URL are required' });
      }

      // Verify the target job exists and is open
      const job = await JobModel.findById(job_id);
      if (!job) {
        return res.status(404).json({ error: 'Job posting not found' });
      }

      if (job.status !== 'Open') {
        return res.status(400).json({ error: 'This job posting has been closed' });
      }

      // Create new application
      const application = await ApplicationModel.create({
        job_id,
        candidate_id: req.user.userId,
        resume_url,
        cover_letter
      });

      // Increment prometheus metric
      metrics.jobApplicationsSubmittedTotal.inc();

      // Audit Log
      await AuditModel.create({
        user_id: req.user.userId,
        action: 'JOB_APPLICATION',
        resource: `APPLICATIONS/${application.id}`,
        ip_address: req.ip
      });

      logger.info(`Candidate ${req.user.email} successfully applied to job ${job_id}`);

      return res.status(201).json({
        message: 'Application submitted successfully',
        application
      });
    } catch (err) {
      // Catch unique violation for candidate + job
      if (err.code === '23505') {
        return res.status(409).json({ error: 'You have already submitted an application for this job posting' });
      }
      logger.error('Job application controller error', err);
      return res.status(500).json({ error: 'Server error submitting application' });
    }
  },

  /**
   * Retrieve all applications submitted by the logged-in candidate.
   */
  async getMyApplications(req, res) {
    try {
      const applications = await ApplicationModel.findByCandidate(req.user.userId);
      return res.status(200).json({ applications });
    } catch (err) {
      logger.error('Get candidate applications error', err);
      return res.status(500).json({ error: 'Server error retrieving applications' });
    }
  },

  /**
   * Retrieve all applications submitted to recruiter postings (Recruiter function).
   */
  async getRecruiterApplications(req, res) {
    try {
      const applications = await ApplicationModel.findByRecruiter(req.user.userId);
      return res.status(200).json({ applications });
    } catch (err) {
      logger.error('Get recruiter applications error', err);
      return res.status(500).json({ error: 'Server error fetching applications' });
    }
  },

  /**
   * Update the status of an application (Recruiter or Admin only).
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = ['Applied', 'Interviewing', 'Offered', 'Rejected'];
      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Valid status (Applied, Interviewing, Offered, Rejected) is required' });
      }

      const application = await ApplicationModel.findById(id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Check permissions: only owner recruiter of the job or Admin can edit status
      if (req.user.role !== 'Admin' && application.recruiter_id !== req.user.userId) {
        logger.logSecurity('Unauthorized Application Status Update Attempt', req.user.userId, req.ip, { applicationId: id });
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }

      const updatedApp = await ApplicationModel.updateStatus(id, status);

      logger.info(`Application ${id} status updated to ${status} by user ${req.user.email}`);

      return res.status(200).json({
        message: 'Application status updated successfully',
        application: updatedApp
      });
    } catch (err) {
      logger.error('Update application status error', err);
      return res.status(500).json({ error: 'Server error updating status' });
    }
  }
};

module.exports = ApplicationController;
