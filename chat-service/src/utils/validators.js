// src/utils/validators.js
const Joi = require('joi');

/**
 * Validadores para Socket.io events y REST endpoints
 */

// Validador para enviar mensaje
const sendMessageSchema = Joi.object({
  receiverId: Joi.string().required().messages({
    'string.empty': 'receiverId es requerido',
    'any.required': 'receiverId es requerido',
  }),
  content: Joi.string().min(1).max(5000).required().messages({
    'string.empty': 'El mensaje no puede estar vacío',
    'string.min': 'El mensaje debe tener al menos 1 caracter',
    'string.max': 'El mensaje no puede exceder 5000 caracteres',
    'any.required': 'content es requerido',
  }),
  replyToId: Joi.number().integer().optional().allow(null),
});

// Validador para typing event
const typingSchema = Joi.object({
  conversationId: Joi.number().integer().required(),
  receiverId: Joi.string().required(),
});

// Validador para marcar como leído
const markAsReadSchema = Joi.object({
  messageId: Joi.number().integer().optional(),
  conversationId: Joi.number().integer().optional(),
}).or('messageId', 'conversationId').messages({
  'object.missing': 'Debe proporcionar messageId o conversationId',
});

// Validador para eliminar mensaje
const deleteMessageSchema = Joi.object({
  messageId: Joi.number().integer().required(),
});

// Validador para búsqueda de mensajes (query params)
const searchMessagesSchema = Joi.object({
  q: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Término de búsqueda requerido',
    'string.min': 'Búsqueda debe tener al menos 1 caracter',
    'string.max': 'Búsqueda no puede exceder 100 caracteres',
  }),
});

// Validador para pagination
const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
  offset: Joi.number().integer().min(0).optional().default(0),
});

/**
 * Middleware para validar datos con Joi
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors,
      });
    }

    // Reemplazar con valores validados
    req[property] = value;
    next();
  };
};

/**
 * Validar payload de Socket.io
 */
const validateSocketPayload = (schema, payload) => {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    value,
  };
};

module.exports = {
  // Schemas
  sendMessageSchema,
  typingSchema,
  markAsReadSchema,
  deleteMessageSchema,
  searchMessagesSchema,
  paginationSchema,
  
  // Validators
  validate,
  validateSocketPayload,
};