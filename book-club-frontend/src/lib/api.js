// src/lib/api.js

// frontend/src/lib/api.js

import axios from 'axios';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ✅ Helper para obtener el token desde auth-storage
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  
  const storage = localStorage.getItem('auth-storage');
  if (!storage) return null;
  
  try {
    const { state } = JSON.parse(storage);
    return state?.accessToken || null;
  } catch (error) {
    console.error('Error parsing auth storage:', error);
    return null;
  }
};

// ✅ Crear instancia de API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request interceptor - agregar token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token agregado al request');
    } else {
      console.log('⚠️ No hay token disponible');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - manejar errores y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no hemos intentado refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Si ya estamos refrescando, agregar a la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Intentar obtener refresh token
      const storage = localStorage.getItem('auth-storage');
      let refreshToken = null;
      
      if (storage) {
        try {
          const { state } = JSON.parse(storage);
          refreshToken = state?.refreshToken;
        } catch (error) {
          console.error('Error parsing auth storage for refresh:', error);
        }
      }

      if (!refreshToken) {
        console.log('❌ No refresh token - redirigiendo a login');
        localStorage.removeItem('auth-storage');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Intentar refresh
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data.data;
        
        // Actualizar token en auth-storage
        const authStorage = JSON.parse(localStorage.getItem('auth-storage'));
        authStorage.state.accessToken = accessToken;
        localStorage.setItem('auth-storage', JSON.stringify(authStorage));

        // Actualizar header y reintentar
        api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
        
        processQueue(null, accessToken);
        
        return axios(originalRequest);
      } catch (err) {
        console.error('❌ Refresh token failed:', err);
        processQueue(err, null);
        localStorage.removeItem('auth-storage');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Service unavailable
    if (error.response?.status === 503) {
      console.error('Service unavailable:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

// ✅ Helper para uploads (bypass gateway)
export const uploadBook = async (formData) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No hay token de autenticación. Inicia sesión nuevamente.');
  }

  const LIBRARY_SERVICE_URL = process.env.NEXT_PUBLIC_LIBRARY_SERVICE_URL || 'http://localhost:3003';

  console.log('📤 Uploading to:', `${LIBRARY_SERVICE_URL}/api/library/books`);
  console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'No token');

  try {
    const response = await axios.post(
      `${LIBRARY_SERVICE_URL}/api/library/books`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 60000, // 60 segundos
      }
    );

    console.log('✅ Upload exitoso:', response.data);
    return response;
  } catch (error) {
    console.error('❌ Upload error:', error.response?.data || error.message);
    
    // Si es 401, limpiar storage
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    throw error;
  }
};

export default api;