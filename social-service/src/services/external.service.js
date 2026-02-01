// social-service/src/services/external.service.js
const axios = require('axios');
const servicesConfig = require('../config/services.config');

class ExternalService {

  /**
   * Buscar usuarios en el user-service
   */
  async searchUsers(query, page, limit, token) {
    try {
      const url = `${servicesConfig.USER_SERVICE_URL}/api/users/search`;
      console.log(`📍 Llamando a: ${url}?q=${query}`);
      
      const response = await axios.get(url, {
        params: { q: query, page, limit },
        headers: { Authorization: token },
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error buscando usuarios:', error.message);
      throw new Error('No se pudo buscar usuarios');
    }
  }

  /**
   * ✅ Obtener múltiples perfiles de usuarios (CORREGIDO)
   * Usa la ruta /profiles/batch que configuramos en user-service
   */
  async getUserProfiles(userIds, token) {
    // Validación de seguridad
    if (!userIds || userIds.length === 0) return [];

    try {
      // 🟢 CAMBIO CLAVE AQUÍ: Agregar '/profiles'
      const url = `${servicesConfig.USER_SERVICE_URL}/api/users/profiles/batch`;
      
      console.log(`📍 Llamando a: ${url} con ${userIds.length} usuarios`);
      
      const response = await axios.post(url, 
        { userIds },
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return response.data.data || response.data || [];
    } catch (error) {
      console.error('❌ Error obteniendo perfiles de usuarios:', error.message);
      return []; // Retornar vacío para no romper la UI
    }
  }

  /**
   * Obtener perfil de UN usuario (Singular)
   */
  async getUserProfile(userId, token) {
    try {
      const url = `${servicesConfig.USER_SERVICE_URL}/api/users/${userId}`;
      // console.log(`📍 Llamando a: ${url}`); // Descomentar si necesitas depurar
      
      const response = await axios.get(url, {
        headers: { Authorization: token },
        timeout: 5000
      });

      return response.data.data || response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo perfil ${userId}:`, error.message);
      return null; 
    }
  }

  /**
   * Obtener información de un libro
   */
  async getBookInfo(bookId, token) {
    try {
      const url = `${servicesConfig.LIBRARY_SERVICE_URL}/api/library/books/${bookId}`;
      const response = await axios.get(url, {
        headers: { Authorization: token },
        timeout: 5000
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo libro ${bookId}:`, error.message);
      return null;
    }
  }

  /**
   * Otorgar puntos XP en gamification-service
   */
  async awardXP(userId, points, reason, token) {
    try {
      const url = `${servicesConfig.GAMIFICATION_SERVICE_URL}/api/gamification/points/award`; // Ajusta si tu ruta es diferente
      
      const response = await axios.post(url,
        { userId, points, reason },
        {
          headers: { Authorization: token },
          timeout: 5000
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error otorgando XP:', error.message);
      return null;
    }
  }

  /**
   * Registrar actividad de lectura
   */
  async registerReadingActivity(userId, activityType, metadata, token) {
    try {
      const url = `${servicesConfig.GAMIFICATION_SERVICE_URL}/api/gamification/stats/update`;
      const response = await axios.post(url,
        { userId, activityType, ...metadata },
        { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error registrando actividad:', error.message);
      return null;
    }
  }
}

module.exports = new ExternalService();

/*
const prisma = require('../config/database');
const axios = require('axios');

class ExternalService {
  constructor() {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
    this.libraryServiceUrl = process.env.LIBRARY_SERVICE_URL || 'http://localhost:3003';
    this.gamificationServiceUrl = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004';
  }

  // =====================================================
  // USER SERVICE
  // =====================================================

  /**
   * Obtener perfil de usuario por ID
   */
  /*
  async getUserProfile(userId, token) {
    try {
      const response = await axios.get(
        `${this.userServiceUrl}/profile/${userId}`, // ✅ Ajustado ruta
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo perfil de usuario ${userId}:`, error.message);
      throw new Error('No se pudo obtener el perfil del usuario');
    }
  }

  /**
   * Obtener múltiples perfiles de usuarios (uno por uno si no existe batch)
   */
  /*
  async getMultipleProfiles(userIds, token) {
    try {
      // Intentar endpoint batch primero (si existe)
      try {
        const response = await axios.post(
          `${this.userServiceUrl}/profile/batch`,
          { userIds },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          }
        );
        return response.data;
      } catch (batchError) {
        // Si no existe batch, obtener uno por uno
        console.log('Batch endpoint no disponible, obteniendo perfiles individualmente');
        const profiles = await Promise.all(
          userIds.map(async (userId) => {
            try {
              return await this.getUserProfile(userId, token);
            } catch (error) {
              return null;
            }
          })
        );
        return profiles.filter(p => p !== null);
      }
    } catch (error) {
      console.error('Error obteniendo múltiples perfiles:', error.message);
      return [];
    }
  }

  /**
   * Buscar usuarios por username
   */
  /*
  async searchUsers(query, token) {
    try {
      const response = await axios.get(
        `${this.userServiceUrl}/profile/search?q=${encodeURIComponent(query)}`, // ✅ Ajustado ruta
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error buscando usuarios:', error.message);
      return [];
    }
  }

  // =====================================================
  // LIBRARY SERVICE
  // =====================================================

  /**
   * Obtener información de un libro por ID
   */
  /*
  async getBookById(bookId, token) {
    try {
      const response = await axios.get(
        `${this.libraryServiceUrl}/books/${bookId}`, // ✅ Ajustado ruta
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo libro ${bookId}:`, error.message);
      throw new Error('No se pudo obtener la información del libro');
    }
  }

  /**
   * Obtener libros de la biblioteca personal del usuario
   */
  /*
  async getUserBooks(userId, token) {
    try {
      const response = await axios.get(
        `${this.libraryServiceUrl}/user-books?userId=${userId}`, // ✅ Ajustado ruta
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo libros del usuario ${userId}:`, error.message);
      return [];
    }
  }

  /**
   * Buscar libros en Google Books
   */
  /*
  async searchGoogleBooks(query, token) {
    try {
      const response = await axios.get(
        `${this.libraryServiceUrl}/books/search?q=${encodeURIComponent(query)}`, // ✅ Ajustado ruta
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error buscando en Google Books:', error.message);
      return [];
    }
  }

  // =====================================================
  // GAMIFICATION SERVICE
  // =====================================================

  /**
   * Otorgar puntos XP a un usuario
   */
  /*
  async awardPoints(userId, points, reason, token) {
    try {
      const response = await axios.post(
        `${this.gamificationServiceUrl}/xp/award`, // ✅ Ajustado ruta
        {
          userId,
          points,
          reason,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error otorgando puntos:', error.message);
      // No lanzar error, la gamificación es secundaria
      return null;
    }
  }

  /**
   * Registrar actividad de lectura
   */
  /*
  async recordReadingActivity(userId, activityData, token) {
    try {
      const response = await axios.post(
        `${this.gamificationServiceUrl}/activity/reading`, // ✅ Ajustado ruta
        {
          userId,
          ...activityData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error registrando actividad de lectura:', error.message);
      return null;
    }
  }

  /**
   * Verificar y desbloquear logros
   */
  /*
  async checkAchievements(userId, achievementType, token) {
    try {
      const response = await axios.post(
        `${this.gamificationServiceUrl}/achievements/check`, // ✅ Ajustado ruta
        {
          userId,
          type: achievementType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error verificando logros:', error.message);
      return null;
    }
  }

  // =====================================================
  // AUTH SERVICE
  // =====================================================

  /**
   * Verificar JWT token
   */
  /*
  async verifyToken(token) {
    try {
      const response = await axios.post(
        `${this.authServiceUrl}/auth/verify`, // ✅ Ajustado ruta
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error verificando token:', error.message);
      throw new Error('Token inválido');
    }
  }
}

module.exports = new ExternalService();

/*
const axios = require('axios');

class ExternalService {
  constructor() {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';
    this.libraryServiceUrl = process.env.LIBRARY_SERVICE_URL || 'http://library-service:3003';
    this.gamificationServiceUrl = process.env.GAMIFICATION_SERVICE_URL || 'http://gamification-service:3004';
  }

  // =====================================================
  // USER SERVICE
  // =====================================================

  /**
   * Obtener perfil de usuario por ID
   */
  /*
  async getUserProfile(userId, token) {
    try {
      const response = await axios.get(
        `${this.userServiceUrl}/api/profile/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo perfil de usuario ${userId}:`, error.message);
      throw new Error('No se pudo obtener el perfil del usuario');
    }
  }

  /**
   * Obtener múltiples perfiles de usuarios
   */
  /*
  async getMultipleProfiles(userIds, token) {
    try {
      const response = await axios.post(
        `${this.userServiceUrl}/api/profile/batch`,
        { userIds },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo múltiples perfiles:', error.message);
      return []; // Retorna array vacío en caso de error
    }
  }

  /**
   * Buscar 
   * /*
  async searchUsers(query, token) {
    try {
      const response = await axios.get(
        `${this.userServiceUrl}/api/profile/search?q=${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error buscando usuarios:', error.message);
      return [];
    }
  }

  // =====================================================
  // LIBRARY SERVICE
  // =====================================================

  /**
   * Obtener información de un libro por ID
   */
  /*
  async getBookById(bookId, token) {
    try {
      const response = await axios.get(
        `${this.libraryServiceUrl}/api/books/${bookId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo libro ${bookId}:`, error.message);
      throw new Error('No se pudo obtener la información del libro');
    }
  }

  /**
   * Obtener libros de la biblioteca personal del usuario
   */
  /*
  async getUserBooks(userId, token) {
    try {
      const response = await axios.get(
        `${this.libraryServiceUrl}/api/user-books/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo libros del usuario ${userId}:`, error.message);
      return [];
    }
  }

  /**
   * Buscar libros en Google Books
   */
  /*
  async searchGoogleBooks(query, token) {
    try {
      const response = await axios.get(
        `${this.libraryServiceUrl}/api/books/search?q=${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error buscando en Google Books:', error.message);
      return [];
    }
  }

  // =====================================================
  // GAMIFICATION SERVICE
  // =====================================================

  /**
   * Otorgar puntos XP a un usuario
   */
  /*
  async awardPoints(userId, points, reason, token) {
    try {
      const response = await axios.post(
        `${this.gamificationServiceUrl}/api/xp/award`,
        {
          userId,
          points,
          reason,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error otorgando puntos:', error.message);
      // No lanzar error, la gamificación es secundaria
      return null;
    }
  }

  /**
   * Registrar actividad de lectura
   */
  /*
  async recordReadingActivity(userId, activityData, token) {
    try {
      const response = await axios.post(
        `${this.gamificationServiceUrl}/api/activity/reading`,
        {
          userId,
          ...activityData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error registrando actividad de lectura:', error.message);
      return null;
    }
  }

  /**
   * Verificar y desbloquear logros
   */
  /*
  async checkAchievements(userId, achievementType, token) {
    try {
      const response = await axios.post(
        `${this.gamificationServiceUrl}/api/achievements/check`,
        {
          userId,
          type: achievementType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error verificando logros:', error.message);
      return null;
    }
  }

  // =====================================================
  // AUTH SERVICE
  // =====================================================

  /**
   * Verificar JWT token
   */
  /*
  async verifyToken(token) {
    try {
      const response = await axios.post(
        `${this.authServiceUrl}/api/auth/verify`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error verificando token:', error.message);
      throw new Error('Token inválido');
    }
  }
}

module.exports = new ExternalService();
*/