// chat-service/src/services/http/user.service.js

const axios = require('axios');

// Asegúrate de que apunte al puerto 3002 (User Service)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';

/**
 * Obtener información de múltiples usuarios
 */
const getUserProfiles = async (userIds, token) => {
  try {
    // 🟢 CORRECCIÓN: Usar la ruta estandarizada '/profiles/batch'
    const url = `${USER_SERVICE_URL}/api/users/profiles/batch`;
    
    console.log(`📡 Chat-Service pidiendo perfiles a: ${url}`);

    const response = await axios.post(
      url,
      { userIds },
      {
        headers: { Authorization: token },
        timeout: 5000,
      }
    );
    
    // Soporte para respuesta { success: true, data: [...] } o directo [...]
    return response.data.data || response.data || [];
  } catch (error) {
    console.error(`❌ Error Chat -> User Service (${USER_SERVICE_URL}):`, error.message);
    // Retornamos array vacío para que el chat cargue (aunque sea con nombres genéricos)
    return []; 
  }
};

/**
 * Obtener un solo perfil
 */
const getUserProfile = async (userId, token) => {
  try {
    const url = `${USER_SERVICE_URL}/api/users/${userId}`;
    const response = await axios.get(url, {
      headers: { Authorization: token },
      timeout: 5000
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error perfil usuario ${userId}:`, error.message);
    return null;
  }
};

module.exports = {
  getUserProfiles,
  getUserProfile
};