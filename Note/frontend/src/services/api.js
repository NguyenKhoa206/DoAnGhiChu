import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});
// Only private requests carry an in-memory X-Private-Token grant.
export default api;
