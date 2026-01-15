// src/routes/conversation.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { verifyFriendship } = require('../middlewares/friendship.middleware');
const conversationController = require('../controllers/conversation.controller');

/**
 * @route   GET /api/conversations
 * @desc    Obtener todas las conversaciones del usuario
 * @access  Private
 */
router.get(
  '/',
  authMiddleware,
  conversationController.getUserConversations
);

/**
 * @route   GET /api/conversations/:friendId
 * @desc    Obtener o crear conversación con un amigo
 * @access  Private (requiere amistad)
 */
router.get(
  '/:friendId',
  authMiddleware,
  //verifyFriendship,
  conversationController.getOrCreateConversation
);

/**
 * @route   PUT /api/conversations/:conversationId/read
 * @desc    Marcar conversación como leída
 * @access  Private
 */
router.put(
  '/:conversationId/read',
  authMiddleware,
  conversationController.markConversationAsRead
);

module.exports = router;