// social-service/src/utils/validators.js
const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array(),
    });
  }
  
  next();
};

// =====================================================
// VALIDACIONES PARA PARÁMETROS DE RUTA
// =====================================================

const validateGroupId = [
  param('groupId')
    .notEmpty().withMessage('groupId es requerido')
    .isInt({ min: 1 }).withMessage('groupId debe ser un número entero positivo'),
  handleValidationErrors,
];

const validatePostId = [
  param('postId')
    .notEmpty().withMessage('postId es requerido')
    .isInt({ min: 1 }).withMessage('postId debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateCommentId = [
  param('commentId')
    .notEmpty().withMessage('commentId es requerido')
    .isInt({ min: 1 }).withMessage('commentId debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateGoalId = [
  param('goalId')
    .notEmpty().withMessage('goalId es requerido')
    .isInt({ min: 1 }).withMessage('goalId debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateProposalId = [
  param('proposalId')
    .notEmpty().withMessage('proposalId es requerido')
    .isInt({ min: 1 }).withMessage('proposalId debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateChallengeId = [
  param('challengeId')
    .notEmpty().withMessage('challengeId es requerido')
    .isInt({ min: 1 }).withMessage('challengeId debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateFriendshipId = [
  param('friendshipId')
    .notEmpty().withMessage('friendshipId es requerido')
    .isInt({ min: 1 }).withMessage('friendshipId debe ser un número entero positivo'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA AMISTADES
// =====================================================

const validateFriendRequest = [
  body('friendId')
    .notEmpty().withMessage('friendId es requerido')
    .isString().withMessage('friendId debe ser un string'), // ✅ String, no UUID
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA GRUPOS
// =====================================================

const validateCreateGroup = [
  body('name')
    .notEmpty().withMessage('El nombre del grupo es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 100 }).withMessage('maxMembers debe ser entre 2 y 100'),
  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic debe ser un booleano'),
  handleValidationErrors,
];

const validateUpdateGroup = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 100 }).withMessage('maxMembers debe ser entre 2 y 100'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA POSTS
// =====================================================

const validateCreatePost = [
  body('content')
    .notEmpty().withMessage('El contenido es requerido')
    .isLength({ min: 1, max: 10000 }).withMessage('El contenido debe tener entre 1 y 10000 caracteres'),
  body('bookId')
    .optional()
    .isInt().withMessage('bookId debe ser un número entero'),
  body('bookTitle')
    .optional()
    .isLength({ max: 500 }).withMessage('El título no puede exceder 500 caracteres'),
  body('bookAuthor')
    .optional()
    .isLength({ max: 300 }).withMessage('El autor no puede exceder 300 caracteres'),
  body('bookCoverUrl')
    .optional()
    .isURL().withMessage('bookCoverUrl debe ser una URL válida'),
  body('fileType')
    .optional()
    .isIn(['PDF', 'EPUB']).withMessage('fileType debe ser PDF o EPUB'),
  handleValidationErrors,
];

const validateCreateComment = [
  body('content')
    .notEmpty().withMessage('El contenido es requerido')
    .isLength({ min: 1, max: 5000 }).withMessage('El contenido debe tener entre 1 y 5000 caracteres'),
  body('parentCommentId')
    .optional()
    .isInt().withMessage('parentCommentId debe ser un número entero'), // ✅ Int, no UUID
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA METAS DE LECTURA
// =====================================================

const validateCreateGoal = [
  body('bookId')
    .notEmpty().withMessage('bookId es requerido')
    .isInt().withMessage('bookId debe ser un número entero'),
  body('bookTitle')
    .notEmpty().withMessage('bookTitle es requerido')
    .isLength({ max: 500 }).withMessage('bookTitle no puede exceder 500 caracteres'),
  body('bookAuthor')
    .optional()
    .isLength({ max: 300 }).withMessage('bookAuthor no puede exceder 300 caracteres'),
  body('startDate')
    .notEmpty().withMessage('startDate es requerido')
    .isISO8601().withMessage('startDate debe ser una fecha válida (ISO 8601)'),
  body('endDate')
    .notEmpty().withMessage('endDate es requerido')
    .isISO8601().withMessage('endDate debe ser una fecha válida (ISO 8601)'),
  body('targetPages')
    .optional()
    .isInt({ min: 1 }).withMessage('targetPages debe ser un número positivo'),
  body('frequency')
    .optional()
    .isIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY'])
    .withMessage('frequency debe ser WEEKLY, BIWEEKLY o MONTHLY'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA PROPUESTAS DE LIBROS
// =====================================================

const validateCreateProposal = [
  body('bookId')
    .optional() // ✅ Opcional para carga manual
    .isInt().withMessage('bookId debe ser un número entero'),
  body('bookTitle')
    .notEmpty().withMessage('bookTitle es requerido')
    .isLength({ max: 500 }).withMessage('bookTitle no puede exceder 500 caracteres'),
  body('bookAuthor')
    .optional()
    .isLength({ max: 300 }).withMessage('bookAuthor no puede exceder 300 caracteres'),
  body('source') // ✅ Corregido de bookSource a source
    .notEmpty().withMessage('source es requerido')
    .isIn(['LIBRARY', 'GOOGLE_BOOKS', 'MANUAL'])
    .withMessage('source debe ser LIBRARY, GOOGLE_BOOKS o MANUAL'),
  body('bookDescription')
    .optional()
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
  body('votingEndDate')
    .optional()
    .isISO8601().withMessage('votingEndDate debe ser una fecha válida (ISO 8601)'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA RETOS
// =====================================================

const validateCreateChallenge = [
  body('bookId')
    .notEmpty().withMessage('bookId es requerido')
    .isInt().withMessage('bookId debe ser un número entero'),
  body('bookTitle')
    .notEmpty().withMessage('bookTitle es requerido')
    .isLength({ max: 500 }).withMessage('bookTitle no puede exceder 500 caracteres'),
  body('totalPages')
    .notEmpty().withMessage('totalPages es requerido')
    .isInt({ min: 1 }).withMessage('totalPages debe ser un número positivo'),
  body('startDate')
    .notEmpty().withMessage('startDate es requerido')
    .isISO8601().withMessage('startDate debe ser una fecha válida (ISO 8601)'),
  body('endDate')
    .notEmpty().withMessage('endDate es requerido')
    .isISO8601().withMessage('endDate debe ser una fecha válida (ISO 8601)'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
  body('fromProposalId')
    .optional()
    .isInt().withMessage('fromProposalId debe ser un número entero'),
  handleValidationErrors,
];

const validateUpdateProgress = [
  body('currentPage')
    .notEmpty().withMessage('currentPage es requerido')
    .isInt({ min: 0 }).withMessage('currentPage debe ser un número no negativo'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA BÚSQUEDA Y PAGINACIÓN
// =====================================================

const validateSearch = [
  query('q')
    .notEmpty().withMessage('El parámetro de búsqueda "q" es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('La búsqueda debe tener entre 2 y 100 caracteres'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
  handleValidationErrors,
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  // Parámetros de ruta
  validateGroupId,
  validatePostId,
  validateCommentId,
  validateGoalId,
  validateProposalId,
  validateChallengeId,
  validateFriendshipId,
  // Amistades
  validateFriendRequest,
  // Grupos
  validateCreateGroup,
  validateUpdateGroup,
  // Posts y comentarios
  validateCreatePost,
  validateCreateComment,
  // Metas
  validateCreateGoal,
  // Propuestas
  validateCreateProposal,
  // Retos
  validateCreateChallenge,
  validateUpdateProgress,
  // Búsqueda y paginación
  validateSearch,
  validatePagination,
};

//const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
/*
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array(),
    });
  }
  
  next();
};

// =====================================================
// VALIDACIONES PARA AMISTADES
// =====================================================

const validateFriendRequest = [
  body('friendId')
    .notEmpty().withMessage('friendId es requerido')
    .isUUID().withMessage('friendId debe ser un UUID válido'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA GRUPOS
// =====================================================

const validateCreateGroup = [
  body('name')
    .notEmpty().withMessage('El nombre del grupo es requerido')
    .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 100 }).withMessage('maxMembers debe ser entre 2 y 100'),
  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic debe ser un booleano'),
  handleValidationErrors,
];

const validateUpdateGroup = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 100 }).withMessage('maxMembers debe ser entre 2 y 100'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA POSTS
// =====================================================

const validateCreatePost = [
  body('content')
    .notEmpty().withMessage('El contenido es requerido')
    .isLength({ min: 1, max: 10000 }).withMessage('El contenido debe tener entre 1 y 10000 caracteres'),
  body('title')
    .optional()
    .isLength({ max: 300 }).withMessage('El título no puede exceder 300 caracteres'),
  body('bookId')
    .optional()
    .isInt().withMessage('bookId debe ser un número entero'),
  body('bookSource')
    .optional()
    .isIn(['PERSONAL_LIBRARY', 'GOOGLE_BOOKS', 'MANUAL'])
    .withMessage('bookSource debe ser PERSONAL_LIBRARY, GOOGLE_BOOKS o MANUAL'),
  handleValidationErrors,
];

const validateCreateComment = [
  body('content')
    .notEmpty().withMessage('El contenido es requerido')
    .isLength({ min: 1, max: 5000 }).withMessage('El contenido debe tener entre 1 y 5000 caracteres'),
  body('parentId')
    .optional()
    .isUUID().withMessage('parentId debe ser un UUID válido'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA METAS DE LECTURA
// =====================================================

const validateCreateGoal = [
  body('bookId')
    .notEmpty().withMessage('bookId es requerido')
    .isInt().withMessage('bookId debe ser un número entero'),
  body('bookTitle')
    .notEmpty().withMessage('bookTitle es requerido')
    .isLength({ max: 500 }).withMessage('bookTitle no puede exceder 500 caracteres'),
  body('startDate')
    .notEmpty().withMessage('startDate es requerido')
    .isISO8601().withMessage('startDate debe ser una fecha válida (ISO 8601)'),
  body('endDate')
    .notEmpty().withMessage('endDate es requerido')
    .isISO8601().withMessage('endDate debe ser una fecha válida (ISO 8601)'),
  body('targetPages')
    .optional()
    .isInt({ min: 1 }).withMessage('targetPages debe ser un número positivo'),
  body('frequency')
    .optional()
    .isIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY'])
    .withMessage('frequency debe ser WEEKLY, BIWEEKLY o MONTHLY'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA PROPUESTAS DE LIBROS
// =====================================================

const validateCreateProposal = [
  body('bookId')
    .notEmpty().withMessage('bookId es requerido')
    .isInt().withMessage('bookId debe ser un número entero'),
  body('bookTitle')
    .notEmpty().withMessage('bookTitle es requerido')
    .isLength({ max: 500 }).withMessage('bookTitle no puede exceder 500 caracteres'),
  body('bookAuthor')
    .optional()
    .isLength({ max: 300 }).withMessage('bookAuthor no puede exceder 300 caracteres'),
  body('bookSource')
    .notEmpty().withMessage('bookSource es requerido')
    .isIn(['PERSONAL_LIBRARY', 'GOOGLE_BOOKS', 'MANUAL'])
    .withMessage('bookSource debe ser PERSONAL_LIBRARY, GOOGLE_BOOKS o MANUAL'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
  body('votingEndsAt')
    .optional()
    .isISO8601().withMessage('votingEndsAt debe ser una fecha válida (ISO 8601)'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA RETOS
// =====================================================

const validateCreateChallenge = [
  body('bookId')
    .notEmpty().withMessage('bookId es requerido')
    .isInt().withMessage('bookId debe ser un número entero'),
  body('bookTitle')
    .notEmpty().withMessage('bookTitle es requerido')
    .isLength({ max: 500 }).withMessage('bookTitle no puede exceder 500 caracteres'),
  body('bookTotalPages')
    .notEmpty().withMessage('bookTotalPages es requerido')
    .isInt({ min: 1 }).withMessage('bookTotalPages debe ser un número positivo'),
  body('bookSource')
    .notEmpty().withMessage('bookSource es requerido')
    .isIn(['PERSONAL_LIBRARY', 'GOOGLE_BOOKS', 'MANUAL'])
    .withMessage('bookSource debe ser PERSONAL_LIBRARY, GOOGLE_BOOKS o MANUAL'),
  body('startDate')
    .notEmpty().withMessage('startDate es requerido')
    .isISO8601().withMessage('startDate debe ser una fecha válida (ISO 8601)'),
  body('endDate')
    .notEmpty().withMessage('endDate es requerido')
    .isISO8601().withMessage('endDate debe ser una fecha válida (ISO 8601)'),
  handleValidationErrors,
];

const validateUpdateProgress = [
  body('currentPage')
    .notEmpty().withMessage('currentPage es requerido')
    .isInt({ min: 0 }).withMessage('currentPage debe ser un número no negativo'),
  handleValidationErrors,
];

// =====================================================
// VALIDACIONES PARA BÚSQUEDA Y PAGINACIÓN
// =====================================================

const validateSearch = [
  query('q')
    .notEmpty().withMessage('El parámetro de búsqueda "q" es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('La búsqueda debe tener entre 2 y 100 caracteres'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
  handleValidationErrors,
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateFriendRequest,
  validateCreateGroup,
  validateUpdateGroup,
  validateCreatePost,
  validateCreateComment,
  validateCreateGoal,
  validateCreateProposal,
  validateCreateChallenge,
  validateUpdateProgress,
  validateSearch,
  validatePagination,
};
*/