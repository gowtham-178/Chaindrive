import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-refresh on 401
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return client(original);
      } catch {
        // refresh failed — let callers handle 401
      }
    }
    return Promise.reject(err);
  }
);

export default client;
