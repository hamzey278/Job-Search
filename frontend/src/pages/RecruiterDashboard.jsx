import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' or 'applications'
  
  // Job creation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [salaryRange, setSalaryRange] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRecruiterData = async () => {
    try {
      // Fetch jobs
      const jRes = await api.get('/jobs', {
        params: { status: null } // Get both open and closed jobs
      });
      // Filter jobs owned by this recruiter
      const user = JSON.parse(localStorage.getItem('user'));
      const recruiterJobs = jRes.data.jobs.filter(job => job.created_by === user.id);
      setJobs(recruiterJobs);

      // Fetch applications for this recruiter's jobs
      const aRes = await api.get('/jobs/applications/recruiter');
      setApplications(aRes.data.applications);
    } catch (err) {
      setError(err.message || 'Failed to retrieve dashboard metrics.');
    }
  };

  useEffect(() => {
    fetchRecruiterData();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !description || !location || !employmentType) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      await api.post('/jobs', {
        title,
        description,
        location,
        employment_type: employmentType,
        salary_range: salaryRange
      });
      setSuccess('Job posting created successfully.');
      
      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setSalaryRange('');
      
      fetchRecruiterData();
    } catch (err) {
      setError(err.message || 'Failed to create job posting.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/jobs/applications/${appId}/status`, { status: newStatus });
      setSuccess('Application status updated.');
      fetchRecruiterData();
    } catch (err) {
      setError(err.message || 'Failed to update application status.');
    }
  };

  const toggleJobStatus = async (job) => {
    setError('');
    setSuccess('');
    const newStatus = job.status === 'Open' ? 'Closed' : 'Open';
    try {
      await api.put(`/jobs/${job.id}`, {
        status: newStatus
      });
      setSuccess(`Job status updated to ${newStatus}.`);
      fetchRecruiterData();
    } catch (err) {
      setError(err.message || 'Failed to toggle job state.');
    }
  };

  return (
    <div className="container" style={{ marginTop: '3rem', marginBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Recruiter Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Post job listings, manage statuses, and review submissions.</p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <button
          className="btn"
          onClick={() => setActiveTab('jobs')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'jobs' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'jobs' ? '2px solid var(--brand-primary)' : 'none',
            borderRadius: 0,
            padding: '0.75rem 1rem'
          }}
        >
          My Listings ({jobs.length})
        </button>
        <button
          className="btn"
          onClick={() => setActiveTab('applications')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'applications' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'applications' ? '2px solid var(--brand-primary)' : 'none',
            borderRadius: 0,
            padding: '0.75rem 1rem'
          }}
        >
          Incoming Applications ({applications.length})
        </button>
      </div>

      {activeTab === 'jobs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
          {/* Col 1: Job Post Form */}
          <div className="card" style={{ alignSelf: 'start' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Post a New Job Role</h3>
            <form onSubmit={handleCreateJob}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Job Title *</label>
                <input
                  id="title"
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior DevOps Engineer"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="location">Location *</label>
                <input
                  id="location"
                  type="text"
                  className="form-control"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote / London, UK"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="employmentType">Employment Type</label>
                <select
                  id="employmentType"
                  className="form-control"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="salaryRange">Salary Range (Optional)</label>
                <input
                  id="salaryRange"
                  type="text"
                  className="form-control"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="e.g. $120k - $140k"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label" htmlFor="description">Job Description *</label>
                <textarea
                  id="description"
                  rows="5"
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the job role, requirements, and responsibilities..."
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Creating Posting...' : 'Publish Listing'}
              </button>
            </form>
          </div>

          {/* Col 2: List of active listings */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Active Listings</h3>
            {jobs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You haven't posted any jobs yet.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td style={{ fontWeight: 600 }}>{job.title}</td>
                        <td>{job.location}</td>
                        <td>{job.employment_type}</td>
                        <td>
                          <span className={`badge ${job.status === 'Open' ? 'badge-success' : 'badge-error'}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleJobStatus(job)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          >
                            {job.status === 'Open' ? 'Close' : 'Reopen'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Candidate Submissions ({applications.length})</h3>
          {applications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No candidate submissions received yet.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Job Role</th>
                    <th>Cover Letter</th>
                    <th>Resume File</th>
                    <th>Status Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <span style={{ fontWeight: 600, display: 'block' }}>{app.candidate_name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.candidate_email}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{app.job_title}</td>
                      <td>
                        <div style={{ maxWidth: '250px', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {app.cover_letter || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>None provided</span>}
                        </div>
                      </td>
                      <td>
                        {/* Force download or view from the server path */}
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="badge badge-brand" style={{ display: 'inline-block' }}>
                          View Resume Document
                        </a>
                      </td>
                      <td>
                        <select
                          className="form-control"
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: '140px' }}
                        >
                          <option value="Applied">Applied</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Offered">Offered</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
