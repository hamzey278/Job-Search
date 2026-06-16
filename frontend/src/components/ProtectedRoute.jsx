import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const location = useLocation();

  if (!token) {
    // Route to login page, tracking origin so login can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Deny access and send back to basic job catalog search
    return <Navigate to="/jobs" replace />;
  }

  return children;
}
