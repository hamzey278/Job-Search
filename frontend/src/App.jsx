import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import JobsPage from './pages/JobsPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public search engine routes */}
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Candidate routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['Candidate']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Protected Recruiter dashboard */}
            <Route
              path="/recruiter"
              element={
                <ProtectedRoute allowedRoles={['Recruiter']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin control center */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Default fallback redirects */}
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route path="*" element={<Navigate to="/jobs" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
