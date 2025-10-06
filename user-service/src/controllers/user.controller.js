// user-service/src/controllers/user.controller.js

/**
 * PROPÓSITO:
 * - Manejar requests HTTP
 * - Extraer datos del request (body, params, query, headers)
 * - Llamar al service correspondiente
 * - Devolver respuesta HTTP con el formato correcto
 * 
 * REGLA DE ORO:
 * El controller NO debe tener lógica de negocio
 * Solo debe ser un "traductor" entre HTTP y el service
 */

const userService = require('../services/user.service');
const { defaultAvatars } = require('../utils/cloudinary.utils');

class UserController {
  /**
   * GET /api/users/profile
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req, res, next) {
    try {
      // req.user viene del middleware authenticate
      const userId = req.user.userId;
      
      const data = await userService.getProfile(userId);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      if (error.message === 'PROFILE_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }
      
      next(error);
    }
  }

  /**
   * GET /api/users/:userId
   * Obtener perfil público de otro usuario
   */
  async getPublicProfile(req, res, next) {
    try {
      const { userId } = req.params;
      
      const profile = await userService.getPublicProfile(userId);
      
      res.json({
        success: true,
        data: { profile }
      });
    } catch (error) {
      if (error.message === 'PROFILE_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      next(error);
    }
  }

  /**
   * PUT /api/users/profile
   * Actualizar perfil del usuario autenticado
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = req.body;
      
      const profile = await userService.updateProfile(userId, data);
      
      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: { profile }
      });
    } catch (error) {
      if (error.message === 'PROFILE_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }
      
      next(error);
    }
  }

  /**
   * POST /api/users/profile/avatar
   * Subir imagen personalizada como avatar
   * 
   * NOTA: Este endpoint usa multer middleware para manejar el upload
   * El archivo viene en req.file (no req.body)
   */
  async uploadAvatar(req, res, next) {
    try {
      const userId = req.user.userId;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        });
      }
      
      const profile = await userService.uploadAvatar(userId, req.file.buffer);
      
      res.json({
        success: true,
        message: 'Avatar actualizado exitosamente',
        data: { profile }
      });
    } catch (error) {
      if (error.message === 'PROFILE_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }
      
      next(error);
    }
  }

  /**
   * PUT /api/users/profile/avatar/default
   * Seleccionar un avatar predeterminado
   */
  async selectDefaultAvatar(req, res, next) {
    try {
      const userId = req.user.userId;
      const { avatarName } = req.body;
      
      if (!avatarName) {
        return res.status(400).json({
          success: false,
          message: 'avatarName es requerido'
        });
      }
      
      // Validar que el avatar existe
      if (!defaultAvatars.includes(avatarName)) {
        return res.status(400).json({
          success: false,
          message: 'Avatar no válido',
          availableAvatars: defaultAvatars
        });
      }
      
      const profile = await userService.selectDefaultAvatar(userId, avatarName);
      
      res.json({
        success: true,
        message: 'Avatar actualizado exitosamente',
        data: { profile }
      });
    } catch (error) {
      if (error.message === 'PROFILE_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }
      
      next(error);
    }
  }

  /**
   * GET /api/users/profile/avatars
   * Obtener lista de avatares predeterminados disponibles
   */
  async getDefaultAvatars(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          avatars: defaultAvatars
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/notifications/settings
   * Obtener configuración de notificaciones
   */
  async getNotificationSettings(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const settings = await userService.getNotificationSettings(userId);
      
      res.json({
        success: true,
        data: { settings }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/notifications/settings
   * Actualizar configuración de notificaciones
   */
  async updateNotificationSettings(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = req.body;
      
      const settings = await userService.updateNotificationSettings(userId, data);
      
      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        data: { settings }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/change-password
   * Cambiar contraseña del usuario
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;
      
      const result = await userService.changePassword(userId, currentPassword, newPassword);
      
      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/account
   * Eliminar cuenta del usuario (soft delete)
   */
  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      
      await userService.deleteAccount(userId);
      
      res.json({
        success: true,
        message: 'Cuenta eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/profile/create
   * Crear perfil (llamado desde auth-service después del registro)
   * 
   * NOTA: Este endpoint NO requiere autenticación con JWT
   * porque se llama automáticamente desde auth-service
   * En producción, deberías validar que la llamada viene de auth-service
   * (usando un secret compartido o mutual TLS)
   */
  async createProfile(req, res, next) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId es requerido'
        });
      }
      
      const profile = await userService.createProfile(userId);
      
      res.status(201).json({
        success: true,
        message: 'Perfil creado exitosamente',
        data: { profile }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();