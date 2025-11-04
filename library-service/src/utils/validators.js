const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validación para crear libro
 */
const createBookValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 1, max: 255 })
    .withMessage('El título debe tener entre 1 y 255 caracteres'),

  body('author')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('El autor no puede exceder 255 caracteres'),

  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:\d{10}|\d{13})$/)
    .withMessage('ISBN debe tener 10 o 13 dígitos'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La descripción no puede exceder 2000 caracteres'),

  body('totalPages')
    .optional()
    .isInt({ min: 1, max: 50000 })
    .withMessage('Total de páginas debe ser entre 1 y 50000'),

  body('publishedDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de publicación inválida (usar formato YYYY-MM-DD)'),

  body('language')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Idioma no puede exceder 50 caracteres'),

  body('publisher')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Editorial no puede exceder 255 caracteres'),

  body('shelf')
    .optional()
    .isIn(['WISHLIST', 'IN_PROGRESS', 'FINISHED'])
    .withMessage('Estante debe ser: WISHLIST, IN_PROGRESS o FINISHED'),

  handleValidationErrors,
];

/**
 * Validación para actualizar libro
 */
const updateBookValidation = [
  param('id').isUUID().withMessage('ID de libro inválido'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('El título debe tener entre 1 y 255 caracteres'),

  body('author')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('El autor no puede exceder 255 caracteres'),

  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:\d{10}|\d{13})$/)
    .withMessage('ISBN debe tener 10 o 13 dígitos'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La descripción no puede exceder 2000 caracteres'),

  body('totalPages')
    .optional()
    .isInt({ min: 1, max: 50000 })
    .withMessage('Total de páginas debe ser entre 1 y 50000'),

  body('currentPage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Página actual debe ser un número positivo'),

  body('shelf')
    .optional()
    .isIn(['WISHLIST', 'IN_PROGRESS', 'FINISHED'])
    .withMessage('Estante debe ser: WISHLIST, IN_PROGRESS o FINISHED'),

  handleValidationErrors,
];

/**
 * Validación para calificar libro (estrellas)
 */
const rateBookValidation = [
  param('id').isUUID().withMessage('ID de libro inválido'),

  body('rating')
    .notEmpty()
    .withMessage('Calificación es requerida')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Calificación debe estar entre 0 y 5')
    .custom((value) => {
      // Permitir solo medias estrellas (0, 0.5, 1, 1.5, ..., 5)
      if (value % 0.5 !== 0) {
        throw new Error('Solo se permiten medias estrellas (ej: 3.5)');
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Validación para actualizar progreso de lectura
 */
const updateProgressValidation = [
  param('id').isUUID().withMessage('ID de libro inválido'),

  body('currentPage')
    .notEmpty()
    .withMessage('Página actual es requerida')
    .isInt({ min: 0 })
    .withMessage('Página actual debe ser un número positivo')
    .custom((value, { req }) => {
      // Validar que no exceda totalPages (se valida en el service)
      return true;
    }),

  handleValidationErrors,
];

/**
 * Validación para crear nota
 */
const createNoteValidation = [
  param('bookId').isUUID().withMessage('ID de libro inválido'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('El contenido de la nota es requerido')
    .isLength({ min: 1, max: 5000 })
    .withMessage('La nota debe tener entre 1 y 5000 caracteres'),

  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página debe ser positivo'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate debe ser true o false'),

  handleValidationErrors,
];

/**
 * Validación para actualizar nota
 */
const updateNoteValidation = [
  param('id').isUUID().withMessage('ID de nota inválido'),

  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('La nota debe tener entre 1 y 5000 caracteres'),

  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página debe ser positivo'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate debe ser true o false'),

  handleValidationErrors,
];

/**
 * Validación para query params de búsqueda/filtrado
 */
const searchBooksValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Búsqueda debe tener entre 1 y 255 caracteres'),

  query('shelf')
    .optional()
    .isIn(['WISHLIST', 'IN_PROGRESS', 'FINISHED'])
    .withMessage('Estante debe ser: WISHLIST, IN_PROGRESS o FINISHED'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página debe ser positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe estar entre 1 y 100'),

  handleValidationErrors,
];

module.exports = {
  createBookValidation,
  updateBookValidation,
  rateBookValidation,
  updateProgressValidation,
  createNoteValidation,
  updateNoteValidation,
  searchBooksValidation,
};

/*

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */

/*
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validación para crear libro
 */

/*
const createBookValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 1, max: 255 })
    .withMessage('El título debe tener entre 1 y 255 caracteres'),

  body('author')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('El autor no puede exceder 255 caracteres'),

  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:\d{10}|\d{13})$/)
    .withMessage('ISBN debe tener 10 o 13 dígitos'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La descripción no puede exceder 2000 caracteres'),

  body('totalPages')
    .optional()
    .isInt({ min: 1, max: 50000 })
    .withMessage('Total de páginas debe ser entre 1 y 50000'),

  body('publishedDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de publicación inválida (usar formato YYYY-MM-DD)'),

  body('language')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Idioma no puede exceder 50 caracteres'),

  body('publisher')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Editorial no puede exceder 255 caracteres'),

  body('shelf')
    .optional()
    .isIn(['WISHLIST', 'IN_PROGRESS', 'FINISHED'])
    .withMessage('Estante debe ser: WISHLIST, IN_PROGRESS o FINISHED'),

  handleValidationErrors,
];

/**
 * Validación para actualizar libro
 */

/*
const updateBookValidation = [
  param('id').isUUID().withMessage('ID de libro inválido'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('El título debe tener entre 1 y 255 caracteres'),

  body('author')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('El autor no puede exceder 255 caracteres'),

  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:\d{10}|\d{13})$/)
    .withMessage('ISBN debe tener 10 o 13 dígitos'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La descripción no puede exceder 2000 caracteres'),

  body('totalPages')
    .optional()
    .isInt({ min: 1, max: 50000 })
    .withMessage('Total de páginas debe ser entre 1 y 50000'),

  body('currentPage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Página actual debe ser un número positivo'),

  body('shelf')
    .optional()
    .isIn(['WISHLIST', 'IN_PROGRESS', 'FINISHED'])
    .withMessage('Estante debe ser: WISHLIST, IN_PROGRESS o FINISHED'),

  handleValidationErrors,
];

/**
 * Validación para calificar libro (estrellas)
 */

/*
const rateBookValidation = [
  param('id').isUUID().withMessage('ID de libro inválido'),

  body('rating')
    .notEmpty()
    .withMessage('Calificación es requerida')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Calificación debe estar entre 0 y 5')
    .custom((value) => {
      // Permitir solo medias estrellas (0, 0.5, 1, 1.5, ..., 5)
      if (value % 0.5 !== 0) {
        throw new Error('Solo se permiten medias estrellas (ej: 3.5)');
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Validación para actualizar progreso de lectura
 */

/*
const updateProgressValidation = [
  param('id').isUUID().withMessage('ID de libro inválido'),

  body('currentPage')
    .notEmpty()
    .withMessage('Página actual es requerida')
    .isInt({ min: 0 })
    .withMessage('Página actual debe ser un número positivo')
    .custom((value, { req }) => {
      // Validar que no exceda totalPages (se valida en el service)
      return true;
    }),

  handleValidationErrors,
];

/**
 * Validación para crear nota
 */

/*
const createNoteValidation = [
  param('bookId').isUUID().withMessage('ID de libro inválido'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('El contenido de la nota es requerido')
    .isLength({ min: 1, max: 5000 })
    .withMessage('La nota debe tener entre 1 y 5000 caracteres'),

  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página debe ser positivo'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate debe ser true o false'),

  handleValidationErrors,
];

/**
 * Validación para actualizar nota
 */

/*
const updateNoteValidation = [
  param('id').isUUID().withMessage('ID de nota inválido'),

  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('La nota debe tener entre 1 y 5000 caracteres'),

  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página debe ser positivo'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate debe ser true o false'),

  handleValidationErrors,
];

/**
 * Validación para query params de búsqueda/filtrado
 */

/*
const searchBooksValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Búsqueda debe tener entre 1 y 255 caracteres'),

  query('shelf')
    .optional()
    .isIn(['WISHLIST', 'IN_PROGRESS', 'FINISHED'])
    .withMessage('Estante debe ser: WISHLIST, IN_PROGRESS o FINISHED'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página debe ser positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe estar entre 1 y 100'),

  handleValidationErrors,
];

module.exports = {
  createBookValidation,
  updateBookValidation,
  rateBookValidation,
  updateProgressValidation,
  createNoteValidation,
  updateNoteValidation,
  searchBooksValidation,
};
*/