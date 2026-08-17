import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('logpulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('logpulse_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export interface LogEntry {
  id?: string;
  service: string;
  level: string;
  message: string;
  timestamp: string;
}

export interface ErrorRateBucket {
  key_as_string: string;
  key: number;
  doc_count: number;
  by_level: {
    buckets: { key: string; doc_count: number }[];
  };
}

export interface TopErrorBucket {
  key: string;
  doc_count: number;
  by_message: {
    buckets: { key: string; doc_count: number }[];
  };
}

export async function login(username: string, password: string) {
  const res = await api.post('/api/auth/login', { username, password });
  return res.data.token as string;
}

export async function fetchErrorRate(interval = '10s') {
  const res = await api.get(`/api/logs/stats/error-rate`, { params: { interval } });
  return res.data.buckets.buckets as ErrorRateBucket[];
}

export async function fetchTopErrors() {
  const res = await api.get(`/api/logs/stats/top-errors`);
  return res.data.buckets.buckets as TopErrorBucket[];
}

export async function searchLogs(params: { q?: string; service?: string; level?: string }) {
  const res = await api.get(`/api/logs/search`, { params });
  return res.data.results as LogEntry[];
}
