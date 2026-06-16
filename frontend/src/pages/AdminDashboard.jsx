import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const uRes = await api.get('/admin/users');
        setUsers(uRes.data.users);
      } else if (activeTab === 'logs') {
        const lRes = await api.get('/admin/audit-logs');
        setLogs(lRes.data.logs);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve administrative records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const handleToggleUserActive = async (user) => {
    setError('');
    setSuccess('');
    const newStatus = !user.is_active;
    try {
      await api.put(`/admin/users/${user.id}/status`, {
        is_active: newStatus,
        role: user.role
      });
      setSuccess(`User status for ${user.email} successfully updated.`);
      fetchAdminData();
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (user, newRole) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/admin/users/${user.id}/status`, {
        is_active: user.is_active,
        role: newRole
      });
      setSuccess(`User role for ${user.email} successfully updated to ${newRole}.`);
      fetchAdminData();
    } catch (err) {
      setError(err.message || 'Failed to modify user role permissions.');
    }
  };

  return (
    <div className="container" style={{ marginTop: '3rem', marginBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Admin Control Center</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Audit security events, enable/disable users, and configure roles.</p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <button
          className="btn"
          onClick={() => setActiveTab('users')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'users' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'users' ? '2px solid var(--brand-primary)' : 'none',
            borderRadius: 0,
            padding: '0.75rem 1rem'
          }}
        >
          User Administration
        </button>
        <button
          className="btn"
          onClick={() => setActiveTab('logs')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'logs' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'logs' ? '2px solid var(--brand-primary)' : 'none',
            borderRadius: 0,
            padding: '0.75rem 1rem'
          }}
        >
          System Audit Logs
        </button>
      </div>

      {loading && <p>Retrieving administrative ledger...</p>}

      {!loading && activeTab === 'users' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Platform Users ({users.length})</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Failed Attempts</th>
                  <th>Lock Status</th>
                  <th>Action Toggle</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span style={{ fontWeight: 600, display: 'block' }}>{u.full_name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Registered: {new Date(u.created_at).toLocaleDateString()}</span>
                    </td>
                    <td>
                      {/* Dropdown to change role */}
                      <select
                        className="form-control"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: '130px' }}
                      >
                        <option value="Candidate">Candidate</option>
                        <option value="Recruiter">Recruiter</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {u.failed_login_attempts}
                    </td>
                    <td>
                      {u.account_locked_until && new Date(u.account_locked_until) > new Date() ? (
                        <span className="badge badge-error">
                          Locked Until: {new Date(u.account_locked_until).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="badge badge-success">Unlocked</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleUserActive(u)}
                        className={`btn ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.85rem' }}
                      >
                        {u.is_active ? 'Disable Account' : 'Enable Account'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'logs' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Security Audit Trail (Latest 200 Actions)</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User Identity</th>
                  <th>Action Triggered</th>
                  <th>Target Resource</th>
                  <th>Client IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      {log.user_email ? (
                        <div>
                          <span style={{ fontWeight: 600, display: 'block' }}>{log.user_name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.user_email} ({log.user_role})</span>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Unauthenticated Guest</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        log.action.includes('LOCKOUT') || log.action.includes('DISABLE') || log.action.includes('DENIED')
                          ? 'badge-error'
                          : log.action.includes('LOGIN')
                          ? 'badge-success'
                          : 'badge-brand'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {log.resource}
                    </td>
                    <td>
                      {log.ip_address || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
