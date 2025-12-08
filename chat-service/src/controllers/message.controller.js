// src/controllers/message.controller.js (CORRECCIÓN)
const messageService = require('../services/message.service');
const { prisma } = require('../config/database');

/**
 * Obtener mensajes de una conversación
 * GET /api/messages/:conversationId
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.conversationId);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Verificar que el usuario sea parte de la conversación
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación',
      });
    }

    const messages = await messageService.getConversationMessages(conversationId, limit, offset);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('❌ Error en getMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo mensajes',
    });
  }
};

/**
 * Buscar mensajes en una conversación
 * GET /api/messages/:conversationId/search
 */
const searchMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.conversationId);
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido',
      });
    }

    // Verificar acceso a la conversación
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación',
      });
    }

    const messages = await messageService.searchMessages(conversationId, searchTerm);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('❌ Error en searchMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Error buscando mensajes',
    });
  }
};

module.exports = {
  getMessages,
  searchMessages,
};
