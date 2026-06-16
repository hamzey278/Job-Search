import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/jobs" className="logo">
          SecureJob<span>Portal</span>
        </Link>
        <div className="nav-links">
          <Link to="/jobs" className={`nav-link ${isActive('/jobs')}`}>Browse Jobs</Link>
          
          {!token ? (
            <>
              <Link to="/login" className={`nav-link ${isActive('/login')}`}>Login</Link>
              <Link to="/register" className={`nav-link btn btn-primary ${isActive('/register')}`} style={{ padding: '0.4rem 1.2rem', borderRadius: '6px' }}>
                Register
              </Link>
            </>
          ) : (
            <>
              {user?.role === 'Candidate' && (
                <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>My Profile</Link>
              )}
              {user?.role === 'Recruiter' && (
                <Link to="/recruiter" className={`nav-link ${isActive('/recruiter')}`}>Recruiter Dashboard</Link>
              )}
              {user?.role === 'Admin' && (
                <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>Admin Dashboard</Link>
              )}
              <span style={{ color: 'var(--border-subtle)' }}>|</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {user?.full_name} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({user?.role})</span>
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
