// user-service/src/services/user.service.js

/**
 * PROPÓSITO:
 * - Contener TODA la lógica de negocio relacionada con perfiles
 * - Interactuar con la base de datos (Prisma)
 * - Interactuar con servicios externos (Cloudinary, auth-service)
 * - Mantener los controllers limpios y enfocados solo en HTTP
 * 
 * PATRÓN DE ARQUITECTURA:
 * Controller (maneja HTTP) → Service (lógica de negocio) → Database (datos)
 * 
 * POR QUÉ SEPARAR SERVICE DE CONTROLLER:
 * - Reusabilidad: puedes usar el service desde diferentes lugares
 * - Testing: más fácil hacer tests unitarios
 * - Claridad: cada capa tiene una responsabilidad específica
 */

const prisma = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary.utils');
const axios = require('axios');

class UserService {
  /**
   * CREAR PERFIL
   * Se llama automáticamente cuando un usuario se registra
   * 
   * @param {String} userId - ID del usuario creado en auth-service
   * @returns {Object} - Perfil creado
   * 
   * FLUJO:
   * 1. Usuario se registra en auth-service
   * 2. auth-service llama a este método (webhook o llamada directa)
   * 3. Se crea perfil con valores por defecto
   * 4. Usuario puede editarlo después
   */
  async createProfile(userId) {
    // Verificar si ya existe perfil (idempotencia)
    const existing = await prisma.profile.findUnique({
      where: { userId }
    });
    
    if (existing) {
      return existing;
    }
    
    // Crear perfil con valores por defecto
    const profile = await prisma.profile.create({
      data: {
        userId,
        avatarType: 'DEFAULT',
        defaultAvatar: 'avatar_01.png', // Avatar predeterminado
        isProfilePublic: true,
        showLocation: false,
        showStats: true
      }
    });
    
    // Crear configuración de notificaciones por defecto
    await prisma.notificationSettings.create({
      data: {
        userId,
        emailEnabled: true,
        pushEnabled: true,
        friendRequests: true,
        groupInvites: true,
        newMessages: true,
        readingReminders: true,
        achievements: true
      }
    });
    
    return profile;
  }

  /**
   * OBTENER PERFIL PROPIO
   * 
   * @param {String} userId - ID del usuario autenticado
   * @returns {Object} - Perfil completo con configuraciones
   */
  async getProfile(userId) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        // Incluir configuración de notificaciones en la respuesta
        // Así el frontend puede mostrar ambos en la misma pantalla
      }
    });
    
    if (!profile) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    
    // Obtener configuración de notificaciones
    const notificationSettings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });
    
    return {
      profile,
      notificationSettings
    };
  }

  /**
   * OBTENER PERFIL PÚBLICO DE OTRO USUARIO
   * 
   * @param {String} userId - ID del usuario a consultar
   * @returns {Object} - Perfil público (datos limitados)
   * 
   * PRIVACIDAD:
   * - Solo mostrar datos que el usuario configuró como públicos
   * - No mostrar email, birthDate si no es público
   * - Respetar showLocation, showStats
   */
  async getPublicProfile(userId) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        displayName: true,
        bio: true,
        avatarType: true,
        avatarUrl: true,
        defaultAvatar: true,
        favoriteGenres: true,
        readingGoal: true,
        isProfilePublic: true,
        showLocation: true,
        showStats: true,
        // Solo incluir ubicación si showLocation = true
        country: true,
        city: true,
        // NO incluir: email, birthDate, province, latitude, longitude
        createdAt: true
      }
    });
    
    if (!profile) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    
    // Si el perfil no es público, no mostrar nada excepto nombre
    if (!profile.isProfilePublic) {
      return {
        displayName: profile.displayName || 'Usuario privado',
        isProfilePublic: false
      };
    }
    
    // Filtrar ubicación si showLocation = false
    if (!profile.showLocation) {
      delete profile.country;
      delete profile.city;
    }
    
    return profile;
  }

  /**
   * ACTUALIZAR PERFIL
   * 
   * @param {String} userId - ID del usuario autenticado
   * @param {Object} data - Datos a actualizar
   * @returns {Object} - Perfil actualizado
   * 
   * IMPORTANTE:
   * - Solo actualizar campos que se enviaron
   * - No sobrescribir campos con undefined
   * - Validaciones ya se hicieron en validators.js
   */
  async updateProfile(userId, data) {
    // Construir objeto de actualización solo con campos presentes
    const updateData = {};
    
    // Campos de texto
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    
    // Fecha de nacimiento
    if (data.birthDate !== undefined) {
      updateData.birthDate = new Date(data.birthDate);
    }
    
    // Ubicación
    if (data.country !== undefined) updateData.country = data.country;
    if (data.province !== undefined) updateData.province = data.province;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    
    // Preferencias
    if (data.favoriteGenres !== undefined) updateData.favoriteGenres = data.favoriteGenres;
    if (data.readingGoal !== undefined) updateData.readingGoal = data.readingGoal;
    
    // Privacidad
    if (data.isProfilePublic !== undefined) updateData.isProfilePublic = data.isProfilePublic;
    if (data.showLocation !== undefined) updateData.showLocation = data.showLocation;
    if (data.showStats !== undefined) updateData.showStats = data.showStats;
    
    const profile = await prisma.profile.update({
      where: { userId },
      data: updateData
    });
    
    return profile;
  }

  /**
   * SUBIR AVATAR (imagen personalizada)
   * 
   * @param {String} userId - ID del usuario
   * @param {Buffer} fileBuffer - Contenido de la imagen
   * @returns {Object} - Perfil actualizado con nueva URL
   * 
   * FLUJO:
   * 1. Obtener perfil actual
   * 2. Si tenía avatar subido anteriormente, eliminarlo de Cloudinary
   * 3. Subir nueva imagen a Cloudinary
   * 4. Actualizar perfil con nueva URL
   * 5. Cambiar avatarType a UPLOADED
   */
  async uploadAvatar(userId, fileBuffer) {
    // Obtener perfil actual
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    
    // Si tenía avatar subido, eliminarlo
    if (profile.avatarType === 'UPLOADED' && profile.avatarUrl) {
      // Extraer publicId de la URL
      // Ejemplo URL: https://res.cloudinary.com/demo/image/upload/v1234567890/book-club/avatars/abc123.jpg
      // publicId: book-club/avatars/abc123
      const urlParts = profile.avatarUrl.split('/');
      const filename = urlParts[urlParts.length - 1].split('.')[0];
      const publicId = `book-club/avatars/${filename}`;
      
      await deleteFromCloudinary(publicId);
    }
    
    // Subir nueva imagen
    const { url } = await uploadToCloudinary(fileBuffer, 'book-club/avatars');
    
    // Actualizar perfil
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        avatarType: 'UPLOADED',
        avatarUrl: url,
        defaultAvatar: null
      }
    });
    
    return updatedProfile;
  }

  /**
   * SELECCIONAR AVATAR PREDETERMINADO
   * 
   * @param {String} userId - ID del usuario
   * @param {String} avatarName - Nombre del avatar (ej: "avatar_03.png")
   * @returns {Object} - Perfil actualizado
   */
  async selectDefaultAvatar(userId, avatarName) {
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    
    // Si tenía avatar subido, eliminarlo de Cloudinary
    if (profile.avatarType === 'UPLOADED' && profile.avatarUrl) {
      const urlParts = profile.avatarUrl.split('/');
      const filename = urlParts[urlParts.length - 1].split('.')[0];
      const publicId = `book-club/avatars/${filename}`;
      
      await deleteFromCloudinary(publicId);
    }
    
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        avatarType: 'DEFAULT',
        avatarUrl: null,
        defaultAvatar: avatarName
      }
    });
    
    return updatedProfile;
  }

  /**
   * OBTENER CONFIGURACIÓN DE NOTIFICACIONES
   */
  async getNotificationSettings(userId) {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });
    
    // Si no existe, crearla con valores por defecto
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          userId,
          emailEnabled: true,
          pushEnabled: true,
          friendRequests: true,
          groupInvites: true,
          newMessages: true,
          readingReminders: true,
          achievements: true
        }
      });
    }
    
    return settings;
  }

  /**
   * ACTUALIZAR CONFIGURACIÓN DE NOTIFICACIONES
   */
  async updateNotificationSettings(userId, data) {
    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });
    
    return settings;
  }

  /**
   * CAMBIAR CONTRASEÑA
   * Este método debe llamar al auth-service
   * 
   * @param {String} userId - ID del usuario
   * @param {String} currentPassword - Contraseña actual
   * @param {String} newPassword - Nueva contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Llamar al endpoint de auth-service para cambiar contraseña
      const response = await axios.put(
        `${process.env.AUTH_SERVICE_URL}/api/auth/change-password`,
        {
          userId,
          currentPassword,
          newPassword
        },
        {
          timeout: 5000
        }
      );
      
      return response.data;
    } catch (error) {
      if (error.response) {
        // auth-service respondió con error
        throw new Error(error.response.data.message || 'Error al cambiar contraseña');
      } else {
        // auth-service no responde
        throw new Error('Servicio de autenticación no disponible');
      }
    }
  }

  /**
   * ELIMINAR CUENTA (soft delete)
   * 
   * @param {String} userId - ID del usuario
   * 
   * FLUJO:
   * 1. Marcar perfil como eliminado (soft delete)
   * 2. Llamar a auth-service para desactivar usuario
   * 3. NO eliminar datos (GDPR: el usuario puede pedir recuperación dentro de 30 días)
   */
  async deleteAccount(userId) {
    // Marcar perfil como eliminado
    await prisma.profile.update({
      where: { userId },
      data: {
        isProfilePublic: false,
        // Agregar campo deletedAt si lo tienes en el schema
      }
    });
    
    // Llamar a auth-service para desactivar usuario
    try {
      await axios.put(
        `${process.env.AUTH_SERVICE_URL}/api/auth/deactivate`,
        { userId },
        { timeout: 5000 }
      );
    } catch (error) {
      console.error('Error deactivating user in auth-service:', error.message);
      // Continuar aunque falle (el perfil ya está marcado como eliminado)
    }
    
    return { message: 'Cuenta eliminada exitosamente' };
  }
}

module.exports = new UserService();