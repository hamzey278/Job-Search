import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach JWT token to headers if it exists in local storage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unified error extractor and session cleanup interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errMsg = error.response?.data?.error || 'A network error occurred. Please try again.';
    
    // Auto-clear invalid/expired tokens
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (errMsg.toLowerCase().includes('expired') || errMsg.toLowerCase().includes('token') || error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    return Promise.reject({
      message: errMsg,
      status: error.response?.status,
      originalError: error
    });
  }
);

export default api;
