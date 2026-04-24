import axios from 'axios';

// Requests go to '/api' — Caddy proxies '/api/*' to the backend container.
// Direct dev hits (http://localhost:3000) will 404 '/api', so override
// VITE_API_BASE_URL to point straight at the backend if running without Caddy.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({ baseURL });

// Thin wrappers so pages/hooks don't repeat axios boilerplate. Each returns
// the response body directly; errors bubble up as axios errors.
export const Categories = {
  list: () => api.get('/categories').then((r) => r.data),
  get: (id) => api.get(`/categories/${id}`).then((r) => r.data),
  create: (payload) => api.post('/categories', payload).then((r) => r.data),
  update: (id, payload) =>
    api.patch(`/categories/${id}`, payload).then((r) => r.data),
  remove: (id, { force = false } = {}) =>
    api.delete(`/categories/${id}${force ? '?force=true' : ''}`),
};

export const Nodes = {
  list: (params) => api.get('/nodes', { params }).then((r) => r.data),
  get: (id) => api.get(`/nodes/${id}`).then((r) => r.data),
  subtree: (id) => api.get(`/nodes/${id}/subtree`).then((r) => r.data),
  aggregate: (id) => api.get(`/nodes/${id}/aggregate`).then((r) => r.data),
  create: (payload) => api.post('/nodes', payload).then((r) => r.data),
  update: (id, payload) =>
    api.patch(`/nodes/${id}`, payload).then((r) => r.data),
  reorder: (nodeIds) =>
    api.post('/nodes/reorder', { nodeIds }).then((r) => r.data),
  remove: (id) => api.delete(`/nodes/${id}`),
};

// Merge-on-duplicate surfaces as status 200 with the merged existing node;
// fresh creates return 201. Callers that care (toast text, undo) can check
// the raw response — expose a create-with-status flavor for them.
Nodes.createRaw = (payload) => api.post('/nodes', payload);

// Parse the backend's friendly error shape ({ error, details }) into a
// single string usable by toasts.
export function readApiError(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (data?.error) return data.error;
  if (err?.message) return err.message;
  return fallback;
}
