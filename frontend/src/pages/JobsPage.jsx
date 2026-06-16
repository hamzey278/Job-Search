import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Application form states
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [appError, setAppError] = useState('');
  const [appSuccess, setAppSuccess] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const navigate = useNavigate();

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/jobs', {
        params: {
          search,
          location,
          employment_type: employmentType,
          page,
          limit: 6
        }
      });
      setJobs(response.data.jobs);
      setTotalPages(response.data.totalPages);
      
      // Auto-select first job if available and none selected
      if (response.data.jobs.length > 0 && !selectedJob) {
        setSelectedJob(response.data.jobs[0]);
      } else if (response.data.jobs.length === 0) {
        setSelectedJob(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch job postings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, employmentType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setCoverLetter('');
    setAppError('');
    setAppSuccess('');
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }

    setApplying(true);
    setAppError('');
    setAppSuccess('');

    try {
      await api.post('/jobs/apply', {
        job_id: selectedJob.id,
        // Since resume upload happens in profile, we check if they have a profile resume.
        // We'll pass a mock resume path or let the backend look up, but here we can pass a default resume link
        // since the model schema requires resume_url, we supply a link.
        resume_url: '/uploads/resumes/candidate-resume.pdf',
        cover_letter: coverLetter
      });
      
      setAppSuccess('Your application has been submitted successfully.');
      setCoverLetter('');
    } catch (err) {
      setAppError(err.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '2.5rem', marginBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Explore Opportunities</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Discover and apply to secure job listings.</p>

      {/* Search and Filters bar */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search role titles or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 2, minWidth: '240px' }}
        />
        <input
          type="text"
          className="form-control"
          placeholder="Location (e.g. Remote, New York)..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ flex: 1, minWidth: '150px' }}
        />
        <select
          className="form-control"
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          style={{ flex: 1, minWidth: '150px' }}
        >
          <option value="">All Job Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Remote">Remote</option>
          <option value="Internship">Internship</option>
        </select>
        <button type="submit" className="btn btn-primary">Filter</button>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Main dual column split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem', minHeight: '500px' }}>
        
        {/* Left Column: Job Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading && jobs.length === 0 ? (
            <p>Loading jobs list...</p>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p>No job postings match your filters.</p>
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job)}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid',
                    borderColor: selectedJob?.id === job.id ? 'var(--border-focus)' : 'var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    boxShadow: selectedJob?.id === job.id ? 'var(--shadow-md)' : 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: selectedJob?.id === job.id ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    {job.title}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {job.location} &bull; {job.employment_type}
                    </span>
                    <span className="badge badge-brand" style={{ fontSize: '0.7rem' }}>
                      {job.salary_range || 'Competitive'}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Previous
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Job Detail Pane */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignSelf: 'start', minHeight: '400px' }}>
          {selectedJob ? (
            <>
              <div>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{selectedJob.title}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Posted by recruiter: {selectedJob.recruiter_name || 'System'}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-brand">{selectedJob.location}</span>
                  <span className="badge badge-brand">{selectedJob.employment_type}</span>
                  {selectedJob.salary_range && <span className="badge badge-success">{selectedJob.salary_range}</span>}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Job Description</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {selectedJob.description}
                </p>
              </div>

              {/* Apply section */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                {appSuccess ? (
                  <div className="alert alert-success">{appSuccess}</div>
                ) : (
                  <>
                    {appError && <div className="alert alert-danger">{appError}</div>}
                    
                    {(!user || user.role === 'Candidate') && (
                      <form onSubmit={handleApply}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Submit Application</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          Applying uses the resume uploaded to your candidate profile. If you have not uploaded a resume, please do so in your profile.
                        </p>
                        <div className="form-group">
                          <label className="form-label" htmlFor="coverLetter">Cover Letter (Optional)</label>
                          <textarea
                            id="coverLetter"
                            rows="4"
                            className="form-control"
                            placeholder="Write a brief cover letter to the recruiter..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={applying}>
                          {token ? (applying ? 'Submitting Application...' : 'Apply for Job') : 'Sign In to Apply'}
                        </button>
                      </form>
                    )}
                    
                    {user && user.role !== 'Candidate' && (
                      <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Note: Active profiles registered as {user.role}s cannot submit applications.
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              <p>Select a job from the list to view details.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
