const express = require('express');
const router = express.Router();
const JobController = require('../controllers/jobController');
const ApplicationController = require('../controllers/applicationController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

// Public Job Search Routes
router.get('/', JobController.getAll);
router.get('/:id', JobController.getById);

// Candidate Actions
router.post('/apply', authenticateJWT, authorizeRoles('Candidate'), ApplicationController.apply);
router.get('/applications/me', authenticateJWT, authorizeRoles('Candidate'), ApplicationController.getMyApplications);

// Recruiter Actions
router.post('/', authenticateJWT, authorizeRoles('Recruiter'), JobController.create);
router.put('/:id', authenticateJWT, authorizeRoles('Recruiter', 'Admin'), JobController.update);
router.delete('/:id', authenticateJWT, authorizeRoles('Recruiter', 'Admin'), JobController.delete);
router.get('/applications/recruiter', authenticateJWT, authorizeRoles('Recruiter'), ApplicationController.getRecruiterApplications);
router.put('/applications/:id/status', authenticateJWT, authorizeRoles('Recruiter', 'Admin'), ApplicationController.updateStatus);

module.exports = router;
