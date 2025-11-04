// src/lib/api.js

import axios from 'axios';

// ✅ DEFINIR API_URL correctamente
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

console.log('🔗 API Client URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Request interceptor - agregar token
api.interceptors.request.use(
  (config) => {
    // Solo en el navegador
    if (typeof window !== 'undefined') {
      const storage = localStorage.getItem('auth-storage');
      if (storage) {
        try {
          const { state } = JSON.parse(storage);
          if (state?.accessToken) {
            config.headers.Authorization = `Bearer ${state.accessToken}`;
          }
        } catch (error) {
          console.error('Error parsing auth storage:', error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expirado o inválido
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }

    // Service unavailable
    if (error.response?.status === 503) {
      console.error('Service unavailable:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;