// src/stores/authStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

//const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const API_URL = 'http://localhost:4000'; //prueba hardcoreado

console.log('🔗 API_URL:', API_URL);

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // Login
      login: async (credentials) => {
        try {
          const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
          const { user, accessToken, refreshToken } = response.data.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });

          return { success: true, user };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Error al iniciar sesión',
          };
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);