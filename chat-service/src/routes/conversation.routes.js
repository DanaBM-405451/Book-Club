// src/routes/conversation.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const conversationController = require('../controllers/conversation.controller');

// GET todas
router.get('/', authMiddleware, conversationController.getUserConversations);

// GET/CREATE una específica
router.get('/:friendId', authMiddleware, conversationController.getOrCreateConversation);

// PUT marcar leída
router.put('/:conversationId/read', authMiddleware, conversationController.markConversationAsRead);

// DELETE borrar
router.delete('/:conversationId', authMiddleware, conversationController.deleteConversation);

module.exports = router;