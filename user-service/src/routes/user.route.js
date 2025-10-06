// user-service/src/routes/user.routes.js

/**
 * PROPÓSITO:
 * - Definir todas las rutas del API de usuarios
 * - Aplicar middlewares de autenticación y validación
 * - Mantener las rutas organizadas y documentadas
 * 
 * ESTRUCTURA DE RUTAS:
 * - Rutas públicas: no requieren autenticación
 * - Rutas protegidas: requieren JWT (middleware authenticate)
 * - Rutas admin: requieren rol ADMIN (middleware requireAdmin)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireAdmin } = require('../middleware/user.middleware.js');
const { upload } = require('../utils/cloudinary.utils.js');
const {
  updateProfileValidation,
  updateNotificationSettingsValidation,
  changePasswordValidation
} = require('../utils/validators.js');

/**
 * RUTAS PÚBLICAS
 * No requieren autenticación
 */

// GET /api/users/:userId - Ver perfil público de otro usuario
router.get('/:userId', userController.getPublicProfile);

// GET /api/users/avatars/default - Lista de avatares predeterminados
router.get('/avatars/default', userController.getDefaultAvatars);

/**
 * RUTAS PROTEGIDAS
 * Requieren autenticación (JWT)
 */

// GET /api/users/profile - Ver mi perfil completo
router.get('/profile', authenticate, userController.getProfile);

// PUT /api/users/profile - Actualizar mi perfil
router.put(
  '/profile',
  authenticate,
  updateProfileValidation, // Validar datos antes de procesarlos
  userController.updateProfile
);

/**
 * UPLOAD DE AVATAR
 * 
 * IMPORTANTE: El middleware upload.single('avatar') debe ir ANTES del controller
 * 
 * FLUJO:
 * 1. Multer intercepta el request
 * 2. Extrae el archivo del campo 'avatar'
 * 3. Lo guarda en req.file.buffer
 * 4. El controller accede a req.file.buffer
 */
router.post(
  '/profile/avatar',
  authenticate,
  upload.single('avatar'), // Campo del formulario debe llamarse 'avatar'
  userController.uploadAvatar
);

// PUT /api/users/profile/avatar/default - Seleccionar avatar predeterminado
router.put(
  '/profile/avatar/default',
  authenticate,
  userController.selectDefaultAvatar
);

/**
 * CONFIGURACIÓN DE NOTIFICACIONES
 */

// GET /api/users/notifications/settings - Obtener configuración
router.get(
  '/notifications/settings',
  authenticate,
  userController.getNotificationSettings
);

// PUT /api/users/notifications/settings - Actualizar configuración
router.put(
  '/notifications/settings',
  authenticate,
  updateNotificationSettingsValidation,
  userController.updateNotificationSettings
);

/**
 * CAMBIO DE CONTRASEÑA
 */
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  userController.changePassword
);

/**
 * ELIMINAR CUENTA
 */
router.delete(
  '/account',
  authenticate,
  userController.deleteAccount
);

/**
 * RUTA INTERNA
 * Solo debe ser llamada por auth-service
 * 
 * TODO: Agregar validación de que la llamada viene de auth-service
 * - Opción 1: Secret compartido en header
 * - Opción 2: Mutual TLS
 * - Opción 3: Service mesh (Istio)
 */
router.post('/profile/create', userController.createProfile);

module.exports = router;