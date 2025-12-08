// src/services/http/social.service.js
const axios = require('axios');

const SOCIAL_SERVICE_URL = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3005';

/**
 * Verificar si dos usuarios son amigos
 */
const checkFriendship = async (userId, friendId, token) => {
  try {
    const response = await axios.get(
      `${SOCIAL_SERVICE_URL}/api/social/friends/check/${friendId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ Error consultando social-service:', error.message);
    throw error;
  }
};

/**
 * Obtener lista de amigos de un usuario
 */
const getFriendsList = async (userId, token) => {
  try {
    const response = await axios.get(
      `${SOCIAL_SERVICE_URL}/api/social/friends`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo lista de amigos:', error.message);
    throw error;
  }
};

module.exports = {
  checkFriendship,
  getFriendsList,
};