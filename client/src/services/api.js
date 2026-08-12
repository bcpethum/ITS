import axios from 'axios';

/**
 * Axios Instance — Central API Client
 *
 * All API calls in the app go through this instance.
 * Benefits:
 * - Single base URL configuration (change once, affects everything)
 * - Automatic JWT token injection via request interceptor
 * - Centralized 401 handling (auto-logout on expired token)
 */

const api = axios.create({
  // Uses Vite proxy in dev (vite.config.js), so no CORS issues
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor — Attach JWT token to every outgoing request
// ─────────────────────────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Read user data from localStorage (set by AuthContext on login)
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// Response Interceptor — Handle auth errors globally
// ─────────────────────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // If the server says our token is invalid or expired, force a logout
    if (error.response?.status === 401) {
      // Don't redirect if we're already on auth pages
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Auth API calls
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:    (data) => api.post('/auth/register', data),
  login:       (data) => api.post('/auth/login', data),
  getMe:       ()     => api.get('/auth/me'),
  getAllUsers:  ()     => api.get('/auth/users'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Issues API calls (will be expanded in Phase 2)
// ─────────────────────────────────────────────────────────────────────────────
export const issueAPI = {
  // Placeholder — will be implemented in Phase 2
};

export default api;
