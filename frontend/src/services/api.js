import axios from 'axios';

// Requests go to '/api' — Caddy proxies '/api/*' to the backend container.
// Direct dev hits (http://localhost:3000) will 404 '/api', so override
// VITE_API_BASE_URL to point straight at the backend if running without Caddy.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({ baseURL });

export const Categories = {
  list: () => api.get('/categories').then((r) => r.data),
  get: (id) => api.get(`/categories/${id}`).then((r) => r.data),
  create: (payload) => api.post('/categories', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/categories/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const Nodes = {
  list: (params) => api.get('/nodes', { params }).then((r) => r.data),
  get: (id) => api.get(`/nodes/${id}`).then((r) => r.data),
  create: (payload) => api.post('/nodes', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/nodes/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/nodes/${id}`),
};
