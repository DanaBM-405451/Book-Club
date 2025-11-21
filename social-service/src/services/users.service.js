// src/services/users.service.js

const externalService = require('./external.service');

class UsersService {
  /**
   * Buscar usuarios por username
   */
  async searchUsers(query, page, limit, token) {
    try {
      // ✅ external.service ahora retorna { success, data, pagination }
      const result = await externalService.searchUsers(query, page, limit, token);
      
      // ✅ Retornar el objeto completo
      return result;
    } catch (error) {
      console.error('Error buscando usuarios:', error);
      throw new Error('No se pudo buscar usuarios');
    }
  }

  /**
   * Obtener perfil público de un usuario
   */
  async getUserPublicProfile(userId, token) {
    try {
      const profile = await externalService.getUserProfile(userId, token);
      
      return {
        success: true,
        data: profile
      };
    } catch (error) {
      console.error('Error obteniendo perfil público:', error);
      throw new Error('No se pudo obtener el perfil del usuario');
    }
  }
}

module.exports = new UsersService();