// src/services/http/user.service.js
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';

/**
 * Obtener información básica de un usuario
 */
const getUserProfile = async (userId, token) => {
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/api/profiles/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ Error consultando user-service:', error.message);
    throw error;
  }
};

/**
 * Obtener información de múltiples usuarios
 */
const getUserProfiles = async (userIds, token) => {
  try {
    const response = await axios.post(
      `${USER_SERVICE_URL}/api/profiles/batch`,
      { userIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo perfiles de usuarios:', error.message);
    throw error;
  }
};

module.exports = {
  getUserProfile,
  getUserProfiles,
};