
const { body, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Validaciones para registro
 */
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username solo puede contener letras, números y guiones bajos'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password debe tener al menos 6 caracteres')
    .matches(/[A-Z]/)
    .withMessage('Password debe contener al menos una mayúscula')
    .matches(/[a-z]/)
    .withMessage('Password debe contener al menos una minúscula')
    .matches(/[0-9]/)
    .withMessage('Password debe contener al menos un número'),
  
  handleValidationErrors
];

/**
 * Validaciones para login
 */
const loginValidation = [
  body('emailOrUsername')
    .trim()
    .notEmpty()
    .withMessage('Email o username es requerido'),
  
  body('password')
    .notEmpty()
    .withMessage('Password es requerido'),
  
  handleValidationErrors
];

/**
 * Validaciones para refresh token
 */
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token es requerido'),
  
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  handleValidationErrors
};