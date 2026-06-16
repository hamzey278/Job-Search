import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const fetchProfileAndApps = async () => {
    try {
      const pRes = await api.get('/auth/profile');
      setProfile(pRes.data.user);

      const aRes = await api.get('/jobs/applications/me');
      setApplications(aRes.data.applications);
    } catch (err) {
      setError(err.message || 'Failed to retrieve profile records.');
    }
  };

  useEffect(() => {
    fetchProfileAndApps();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSuccess('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to submit');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/profile/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Resume submitted successfully.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchProfileAndApps();
    } catch (err) {
      setError(err.message || 'Resume upload failed. Max size is 5MB, format must be PDF or DOCX.');
    } finally {
      setUploading(false);
    }
  };

  if (error && !profile) {
    return (
      <div className="container" style={{ marginTop: '3rem' }}>
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container" style={{ marginTop: '4rem', textAlign: 'center' }}>
        <p>Loading candidate metrics...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '3rem', marginBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Candidate Portal</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Track active applications and keep your resume updated.</p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-grid">
        {/* Col 1: Details & Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Personal Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>NAME</span>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{profile.full_name}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>EMAIL ADDRESS</span>
                <span style={{ fontSize: '0.95rem' }}>{profile.email}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>ROLE LEVEL</span>
                <span className="badge badge-brand" style={{ marginTop: '0.25rem' }}>{profile.role}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>REGISTRATION DATE</span>
                <span style={{ fontSize: '0.95rem' }}>{new Date(profile.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Upload Current Resume</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Documents are scanned for security signature headers before storage.
            </p>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <input
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  accept=".pdf,.docx"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploading}>
                {uploading ? 'Analyzing and uploading...' : 'Upload File'}
              </button>
            </form>
          </div>
        </div>

        {/* Col 2: Job Applications */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Submitted Applications ({applications.length})</h3>
          
          {applications.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', flexDirection: 'column' }}>
              <p style={{ fontSize: '0.95rem' }}>No active applications found. Use job explorer to apply.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Job Role</th>
                    <th>Location</th>
                    <th>Commitment</th>
                    <th>Applied On</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.job_title}</td>
                      <td>{app.location}</td>
                      <td>{app.employment_type}</td>
                      <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${
                          app.status === 'Offered' ? 'badge-success' :
                          app.status === 'Rejected' ? 'badge-error' :
                          app.status === 'Interviewing' ? 'badge-warn' : 'badge-brand'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
