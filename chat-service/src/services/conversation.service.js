// src/services/conversation.service.js
const { prisma } = require('../config/database');

/**
 * Obtener o crear una conversación entre dos usuarios
 */
const getOrCreateConversation = async (userId1, userId2) => {
  try {
    // Ordenar IDs para mantener consistencia (participant1 < participant2)
    const [participant1Id, participant2Id] = [userId1, userId2].sort();

    // Buscar conversación existente
    let conversation = await prisma.conversation.findFirst({
      where: {
        participant1Id,
        participant2Id,
      },
      include: {
        readStatus: true,
      },
    });

    // Si no existe, crearla
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1Id,
          participant2Id,
          readStatus: {
            create: [
              { userId: participant1Id, unreadCount: 0 },
              { userId: participant2Id, unreadCount: 0 },
            ],
          },
        },
        include: {
          readStatus: true,
        },
      });
    }

    return conversation;
  } catch (error) {
    console.error('❌ Error en getOrCreateConversation:', error);
    throw error;
  }
};

/**
 * Obtener todas las conversaciones de un usuario
 */
const getUserConversations = async (userId) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
        isActive: true,
      },
      include: {
        readStatus: {
          where: { userId },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Solo el último mensaje
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    return conversations;
  } catch (error) {
    console.error('❌ Error en getUserConversations:', error);
    throw error;
  }
};

/**
 * Actualizar último mensaje de la conversación
 */
const updateConversationLastMessage = async (conversationId, messageContent) => {
  try {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: messageContent.substring(0, 500),
      },
    });
  } catch (error) {
    console.error('❌ Error actualizando último mensaje:', error);
    throw error;
  }
};

/**
 * Incrementar contador de mensajes no leídos
 */
const incrementUnreadCount = async (conversationId, userId) => {
  try {
    return await prisma.conversationReadStatus.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('❌ Error incrementando contador no leídos:', error);
    throw error;
  }
};

/**
 * Marcar conversación como leída
 */
const markConversationAsRead = async (conversationId, userId) => {
  try {
    return await prisma.conversationReadStatus.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastSeenAt: new Date(),
        unreadCount: 0,
      },
    });
  } catch (error) {
    console.error('❌ Error marcando como leída:', error);
    throw error;
  }
};

module.exports = {
  getOrCreateConversation,
  getUserConversations,
  updateConversationLastMessage,
  incrementUnreadCount,
  markConversationAsRead,
};