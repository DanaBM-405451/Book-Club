// src/routes/message.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const messageController = require('../controllers/message.controller');

/**
 * @route   GET /api/messages/:conversationId
 * @desc    Obtener mensajes de una conversación
 * @access  Private
 * @query   limit (default: 50), offset (default: 0)
 */
router.get(
  '/:conversationId',
  authMiddleware,
  messageController.getMessages
);

/**
 * @route   GET /api/messages/:conversationId/search
 * @desc    Buscar mensajes en una conversación
 * @access  Private
 * @query   q (término de búsqueda)
 */
router.get(
  '/:conversationId/search',
  authMiddleware,
  messageController.searchMessages
);

module.exports = router;