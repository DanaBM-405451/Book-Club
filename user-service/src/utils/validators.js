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
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
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
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nombre debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre solo puede contener letras'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Apellido debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellido solo puede contener letras'),
  
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Nombre para mostrar debe tener entre 3 y 150 caracteres'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Biografía no puede exceder 500 caracteres'),
  
  body('birthDate')
    .optional()
    .isISO8601() // Formato: YYYY-MM-DD
    .withMessage('Fecha de nacimiento inválida')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      
      if (birthDate > today) {
        throw new Error('Fecha de nacimiento no puede ser futura');
      }
      
      // Validar edad mínima (13 años - COPPA compliance)
      const minAge = 13;
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < minAge) {
        throw new Error('Debes tener al menos 13 años');
      }
      
      return true;
    }),
  
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('País inválido'),
  
  body('province')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Provincia inválida'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Ciudad inválida'),
  
  body('favoriteGenres')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Géneros favoritos no puede exceder 500 caracteres'),
  
  body('readingGoal')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Meta de lectura debe ser entre 1 y 1000 libros'),
  
  body('isProfilePublic')
    .optional()
    .isBoolean()
    .withMessage('isProfilePublic debe ser true o false'),
  
  body('showLocation')
    .optional()
    .isBoolean()
    .withMessage('showLocation debe ser true o false'),
  
  body('showStats')
    .optional()
    .isBoolean()
    .withMessage('showStats debe ser true o false'),
  
  handleValidationErrors
];

/**
 * VALIDACIONES: Configuración de notificaciones
 * 
 * Todos los campos son booleanos
 */
const updateNotificationSettingsValidation = [
  body('emailEnabled')
    .optional()
    .isBoolean()
    .withMessage('emailEnabled debe ser true o false'),
  
  body('pushEnabled')
    .optional()
    .isBoolean()
    .withMessage('pushEnabled debe ser true o false'),
  
  body('friendRequests')
    .optional()
    .isBoolean()
    .withMessage('friendRequests debe ser true o false'),
  
  body('groupInvites')
    .optional()
    .isBoolean()
    .withMessage('groupInvites debe ser true o false'),
  
  body('newMessages')
    .optional()
    .isBoolean()
    .withMessage('newMessages debe ser true o false'),
  
  body('readingReminders')
    .optional()
    .isBoolean()
    .withMessage('readingReminders debe ser true o false'),
  
  body('achievements')
    .optional()
    .isBoolean()
    .withMessage('achievements debe ser true o false'),
  
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
  body('currentPassword')
    .notEmpty()
    .withMessage('Contraseña actual es requerida'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nueva contraseña debe tener al menos 6 caracteres')
    .matches(/[A-Z]/)
    .withMessage('Nueva contraseña debe contener al menos una mayúscula')
    .matches(/[a-z]/)
    .withMessage('Nueva contraseña debe contener al menos una minúscula')
    .matches(/[0-9]/)
    .withMessage('Nueva contraseña debe contener al menos un número'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirmación de contraseña es requerida')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
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