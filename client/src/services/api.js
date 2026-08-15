import axios from 'axios';

/**
 * Axios Instance — Central API Client
 *
 * All API calls in the app go through this instance.
 * - Single base URL (Vite proxy handles CORS in dev)
 * - Automatic JWT injection via request interceptor
 * - Centralized 401 handling (auto-logout on expired token)
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ── Request Interceptor — Attach JWT ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — Handle 401 globally ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register:    (data) => api.post('/auth/register', data),
  login:       (data) => api.post('/auth/login', data),
  getMe:       ()     => api.get('/auth/me'),
  getAllUsers:  ()     => api.get('/auth/users'),
};

// ── Issues ────────────────────────────────────────────────────────────────
export const issueAPI = {
  getAll:   (params)   => api.get('/issues', { params }),
  getStats: ()         => api.get('/issues/stats'),
  getOne:   (id)       => api.get(`/issues/${id}`),
  create:   (data)     => api.post('/issues', data),
  update:   (id, data) => api.put(`/issues/${id}`, data),
  remove:   (id)       => api.delete(`/issues/${id}`),
};

// ── Comments ──────────────────────────────────────────────────────────────
export const commentAPI = {
  getAll: (issueId)              => api.get(`/issues/${issueId}/comments`),
  add:    (issueId, content)     => api.post(`/issues/${issueId}/comments`, { content }),
  remove: (issueId, commentId)   => api.delete(`/issues/${issueId}/comments/${commentId}`),
};

// ── Activity ──────────────────────────────────────────────────────────────
export const activityAPI = {
  getAll: (issueId) => api.get(`/issues/${issueId}/activity`),
};

// ── Attachments ───────────────────────────────────────────────────────────
export const attachmentAPI = {
  upload: (issueId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/issues/${issueId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (issueId, attachmentId) => api.delete(`/issues/${issueId}/attachments/${attachmentId}`),
};

export default api;
