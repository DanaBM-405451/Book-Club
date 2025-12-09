// user-service/src/controllers/user.controller.js

const userService = require('../services/user.service');
const prisma = require('../config/database'); 
const { defaultAvatars } = require('../utils/cloudinary.utils');

const axios = require('axios');

class UserController {
  /**
   * GET /api/users/profile
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req, res, next) {
    try {
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
   * GET /api/users/avatars/default
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

  /**
   * GET /api/users/search
   * Buscar usuarios por username, nombre o apellido
   * Query params: ?q=texto&page=1&limit=20
   */
  async searchUsers(req, res, next) {
    try {
      const { q, page = 1, limit = 20 } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "q" is required'
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [users, total] = await Promise.all([
        prisma.profile.findMany({
          where: {
            OR: [
              { username: { contains: q} },
              { nombre: { contains: q} },
              { apellido: { contains: q } }
            ]
          },
          select: {
            id: true,
            userId: true,
            username: true,
            nombre: true,
            apellido: true,
            avatarUrl: true,
            bio: true
          },
          skip,
          take: parseInt(limit),
          orderBy: {
            username: 'asc'
          }
        }),
        prisma.profile.count({
          where: {
            OR: [
              { username: { contains: q } },
              { nombre: { contains: q } },
              { apellido: { contains: q } }
            ]
          }
        })
      ]);

      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error searching users:', error);
      next(error);
    }
  }

  /**
   * POST /api/users/batch
   * Obtener múltiples perfiles de usuarios
   * Body: { userIds: ["uuid1", "uuid2", ...] }
   */
  async getBatchProfiles(req, res, next) {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'userIds array is required'
        });
      }

      const profiles = await prisma.profile.findMany({
        where: {
          userId: {
            in: userIds
          }
        },
        select: {
          id: true,
          userId: true,
          username: true,
          nombre: true,
          apellido: true,
          avatarUrl: true,
          bio: true
        }
      });

      res.status(200).json({
        success: true,
        data: profiles
      });
    } catch (error) {
      console.error('Error getting batch profiles:', error);
      next(error);
    }
  }

  /**
   * POST /api/users/invite
   * Enviar invitación por correo
   */
  async inviteUser(req, res, next) {
    try {
      const { email } = req.body;
      const senderName = req.user.username; 

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'El email es requerido' 
        });
      }

      // ✅ CAMBIO CRÍTICO: Usar Axios para llamar a email-service
      const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:3021';
      
      // URL de destino (La página de invitación que creamos)
      const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite?target=app`;

      await axios.post(`${emailServiceUrl}/api/email/send`, {
        to: email,
        subject: `${senderName} te ha invitado a unirte a Book Club`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="color: #d97706; text-align: center;">¡Has sido invitado a Book Club!</h2>
            <p style="color: #374151; font-size: 16px;">Hola,</p>
            <p style="color: #374151; font-size: 16px;">
              Tu amigo <strong>${senderName}</strong> te ha invitado a formar parte de nuestra comunidad de lectores apasionados.
            </p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #4b5563;">En Book Club podrás:</p>
              <ul style="color: #4b5563;">
                <li>Llevar un registro detallado de tus lecturas 📚</li>
                <li>Unirte a grupos y participar en retos 🏆</li>
                <li>Ganar puntos y subir de nivel 🚀</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${inviteUrl}" 
                 style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Unirse Ahora
              </a>
            </div>
            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
              Si no solicitaste esta invitación, puedes ignorar este correo.
            </p>
          </div>
        `,
        type: 'INVITATION'
      });

      res.status(200).json({ 
        success: true, 
        message: 'Invitación enviada correctamente' 
      });
    } catch (error) {
      console.error('Error enviando invitación:', error.message);
      res.status(500).json({ 
        success: false, 
        message: 'Error al enviar la invitación. Verifica que el servicio de email esté activo.' 
      });
    }
  }
  /**
   * GET /api/users/admin/stats
   * Obtener estadísticas globales de usuarios (Admin)
   */
async getAdminStats(req, res, next) {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Acceso denegado' });
      }

      // ✅ CORRECTO: Delegar al servicio
      const stats = await userService.getGlobalStats(); 

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfilesBatch(req, res, next) {
    try {
      const { userIds } = req.body;
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ success: false, message: 'Se requiere un array de userIds' });
      }

      const profiles = await userService.getProfilesByIds(userIds);

      res.json({
        success: true,
        data: profiles
      });
    } catch (error) {
      next(error);
    }
  }
  
}

module.exports = new UserController();


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
/*

const userService = require('../services/user.service');

const { defaultAvatars } = require('../utils/cloudinary.utils');

class UserController {
  /**
   * GET /api/users/profile
   * Obtener perfil del usuario autenticado
   */
  /*
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
  /*
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
  /*
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
  /*
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
  /*
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
  /*
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
  /*
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
  /*
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
  /*
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
  /*
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
  /*
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
*/