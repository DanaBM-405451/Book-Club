// user-service/src/utils/validators.js

/**
 * PROPÓSITO:
 * - Validar datos de entrada ANTES de procesarlos
 * - Prevenir inyecciones SQL, XSS, y datos corruptos
 * - Dar feedback claro al usuario sobre qué está mal
 * 
 * POR QUÉ EN BACKEND SI EL FRONTEND YA VALIDA:
 * - El frontend puede ser manipulado (DevTools, Postman, etc.)
 * - La seguridad NUNCA debe confiar en el cliente
 * - Regla: El frontend valida para UX, el backend valida para SEGURIDAD
 */

const { body, validationResult } = require('express-validator');

/**
 * MIDDLEWARE: Procesar errores de validación
 * 
 * FLUJO:
 * 1. express-validator ejecuta las validaciones
 * 2. Los errores se acumulan
 * 3. Este middleware los revisa
 * 4. Si hay errores, devuelve 400 con detalles
 * 5. Si no hay errores, continúa al controlador
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log para depuración en consola del servidor
    console.log("❌ Error de validación:", JSON.stringify(errors.array(), null, 2)); 
    
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos', // Mensaje genérico
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};
  

/**
 * VALIDACIONES: Actualizar perfil
 * 
 * REGLAS:
 * - firstName y lastName: opcionales, pero si se envían deben ser texto válido
 * - displayName: opcional, entre 3-50 caracteres
 * - bio: opcional, máximo 500 caracteres
 * - birthDate: opcional, debe ser fecha válida y no futuro
 * - country, province, city: opcionales, solo texto
 * - favoriteGenres: opcional, formato "Fantasy, Thriller, Romance"
 * - readingGoal: opcional, número positivo
 */
const updateProfileValidation = [
  // Modificado: Permitir guiones y apóstrofes en nombres
  body('nombre')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Nombre muy largo')
    // Regex ajustado para permitir guiones (-) y apóstrofes (')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\']+$/) 
    .withMessage('Nombre contiene caracteres inválidos'),

  body('apellido')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Apellido muy largo')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\']+$/)
    .withMessage('Apellido contiene caracteres inválidos'),

  body('username') 
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('El nombre de usuario debe tener entre 3 y 150 caracteres'),

  body('bio')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Biografía no puede exceder 500 caracteres'),

  body('birthDate')
    .optional({ checkFalsy: true }) // Permite enviar string vacío ""
    .isISO8601()
    .withMessage('Fecha de nacimiento inválida')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate > today) throw new Error('Fecha no puede ser futura');
      return true;
    }),

  body('pais').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('provincia').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('ciudad').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),

  body('favoriteGeneros')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }),

  
  body('favoriteBookThisMonth')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('El título del libro es muy largo'),

  body('readingGoal')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 1000 }),

  body('isProfilePublic').optional({ checkFalsy: true }).isBoolean(),
  body('showLocation').optional({ checkFalsy: true }).isBoolean(),
  body('showStats').optional({ checkFalsy: true }).isBoolean(),
  body('showReadingActivity').optional({ checkFalsy: true }).isBoolean(), // Agregado por si acaso

  handleValidationErrors
];

/**
 * VALIDACIONES: Configuración de notificaciones
 * 
 * Todos los campos son booleanos
 */
const updateNotificationSettingsValidation = [
  body('emailEnabled').optional({ checkFalsy: true }).isBoolean(),
  body('pushEnabled').optional({ checkFalsy: true }).isBoolean(),
  body('friendRequests').optional({ checkFalsy: true }).isBoolean(),
  body('groupInvites').optional({ checkFalsy: true }).isBoolean(),
  body('newMessages').optional({ checkFalsy: true }).isBoolean(),
  body('readingReminders').optional({ checkFalsy: true }).isBoolean(),
  body('achievements').optional({ checkFalsy: true }).isBoolean(),
  handleValidationErrors
];

/**
 * VALIDACIONES: Cambio de contraseña
 * 
 * FLUJO:
 * 1. Usuario debe proporcionar contraseña actual (para confirmar identidad)
 * 2. Nueva contraseña debe cumplir requisitos de seguridad
 * 3. Confirmar nueva contraseña (deben coincidir)
 * 
 * NOTA: Este endpoint debería estar en auth-service, pero lo dejamos aquí
 * porque está relacionado con la gestión del perfil
 */
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('Mínimo 6 caracteres')
    .matches(/[A-Z]/).withMessage('Falta mayúscula')
    .matches(/[a-z]/).withMessage('Falta minúscula')
    .matches(/[0-9]/).withMessage('Falta número'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error('No coinciden');
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  updateProfileValidation,
  updateNotificationSettingsValidation,
  changePasswordValidation,
  handleValidationErrors
};