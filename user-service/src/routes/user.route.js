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
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { upload } = require('../utils/cloudinary.utils');
const {
  updateProfileValidation,
  updateNotificationSettingsValidation,
  changePasswordValidation
} = require('../utils/validators');

// ============================================
// RUTAS ADMIN
// ============================================

router.get('/admin/stats', authenticate, requireAdmin, userController.getAdminStats);

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

//  (agregar antes de las rutas existentes)
router.get('/search', userController.searchUsers); // Sin auth
router.post('/batch', userController.getBatchProfiles); // Sin auth


//  Las rutas específicas DEBEN ir ANTES de las rutas con parámetros
router.get('/avatars/default', userController.getDefaultAvatars);
router.post('/batch', userController.getProfilesBatch.bind(userController));

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

//  Rutas específicas primero
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, updateProfileValidation, userController.updateProfile);
router.post('/profile/avatar', authenticate, upload.single('avatar'), userController.uploadAvatar);
router.put('/profile/avatar/default', authenticate, userController.selectDefaultAvatar);

router.get('/notifications/settings', authenticate, userController.getNotificationSettings);
router.put('/notifications/settings', authenticate, updateNotificationSettingsValidation, userController.updateNotificationSettings);

router.put('/change-password', authenticate, changePasswordValidation, userController.changePassword);
router.delete('/account', authenticate, userController.deleteAccount);

router.post('/invite', authenticate, userController.inviteUser);

// ============================================
// RUTA INTERNA (sin autenticación)
// ============================================

router.post('/profile/create', userController.createProfile);


// ============================================
// RUTAS CON PARÁMETROS (DEBEN IR AL FINAL)
// ============================================

//  Esta ruta DEBE ir al final porque captura cualquier cosa
router.get('/:userId', userController.getPublicProfile);

module.exports = router;

/*
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller.js');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware.js');
const { upload } = require('../utils/cloudinary.utils.js');
const {
  updateProfileValidation,
  updateNotificationSettingsValidation,
  changePasswordValidation
} = require('../utils/validators');
*/

/*
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller.js');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware.js'); 
const { upload } = require('../utils/cloudinary.utils.js');
const {
  updateProfileValidation,
  updateNotificationSettingsValidation,
  changePasswordValidation
} = require('../utils/validators');
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
/*
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
/*
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
/*
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
/*
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  userController.changePassword
);

/**
 * ELIMINAR CUENTA
 */
/*
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
/*
router.post('/profile/create', userController.createProfile);

module.exports = router;
*/