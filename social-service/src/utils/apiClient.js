// src/utils/apiClient.js
const axios = require('axios');

/**
 * Cliente para comunicación con otros microservicios
 */

// URLs de servicios desde variables de entorno
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const LIBRARY_SERVICE_URL = process.env.LIBRARY_SERVICE_URL || 'http://localhost:3003';
const GAMIFICATION_SERVICE_URL = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004';

/**
 * Obtener perfil de usuario desde user-service
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token para autenticación
 */
const getUserProfile = async (userId, token) => {
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo perfil de usuario ${userId}:`, error.message);
    throw new Error('No se pudo obtener información del usuario');
  }
};

/**
 * Buscar usuarios por username
 * @param {string} query - Término de búsqueda
 * @param {string} token - JWT token
 */
const searchUsers = async (query, token) => {
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/users/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error buscando usuarios:', error.message);
    throw new Error('No se pudo buscar usuarios');
  }
};

/**
 * Obtener información de un libro desde library-service
 * @param {number} bookId - ID del libro
 * @param {string} token - JWT token
 */
const getBookInfo = async (bookId, token) => {
  try {
    const response = await axios.get(
      `${LIBRARY_SERVICE_URL}/books/${bookId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo libro ${bookId}:`, error.message);
    throw new Error('No se pudo obtener información del libro');
  }
};

/**
 * Obtener biblioteca de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 */
const getUserLibrary = async (userId, token) => {
  try {
    const response = await axios.get(
      `${LIBRARY_SERVICE_URL}/user-books?userId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo biblioteca de usuario ${userId}:`, error.message);
    throw new Error('No se pudo obtener la biblioteca del usuario');
  }
};

/**
 * Registrar puntos en gamification-service
 * @param {string} userId - ID del usuario
 * @param {number} points - Puntos a otorgar
 * @param {string} reason - Razón de los puntos
 * @param {string} token - JWT token
 */
const awardPoints = async (userId, points, reason, token) => {
  try {
    const response = await axios.post(
      `${GAMIFICATION_SERVICE_URL}/points/award`,
      {
        userId,
        points,
        reason
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error otorgando puntos a usuario ${userId}:`, error.message);
    // No lanzar error - los puntos son secundarios
    return null;
  }
};

/**
 * Obtener estadísticas de gamificación de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} token - JWT token
 */
const getUserStats = async (userId, token) => {
  try {
    const response = await axios.get(
      `${GAMIFICATION_SERVICE_URL}/stats/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo stats de usuario ${userId}:`, error.message);
    return null;
  }
};

module.exports = {
  getUserProfile,
  searchUsers,
  getBookInfo,
  getUserLibrary,
  awardPoints,
  getUserStats
};
