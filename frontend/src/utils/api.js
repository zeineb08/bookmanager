import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message?.[0] || error.response?.data?.message || 'Something went wrong';

    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('unauthorized'));
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    }

    return Promise.reject(error);
  },
);

export default api;
