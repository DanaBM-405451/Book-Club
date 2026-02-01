// src/services/message.service.js
// src/services/message.service.js
const { prisma } = require('../config/database');

/**
 * Crear un nuevo mensaje
 */
const createMessage = async (conversationId, senderId, receiverId, content, replyToId = null) => {
  try {
    const data = {
      content,
      senderId,
      receiverId,
      messageType: 'TEXT',
      // Conectar con la conversación existente usando su ID
      conversation: {
        connect: { id: parseInt(conversationId) }
      }
    };

    // Si hay respuesta a otro mensaje, conectarlo también
    if (replyToId) {
      data.replyTo = {
        connect: { id: parseInt(replyToId) }
      };
    }

    const message = await prisma.message.create({
      data,
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });

    return message;
  } catch (error) {
    console.error('❌ Error creating message:', error);
    throw error;
  }
};

/**
 * Obtener mensajes de una conversación
 */
const getConversationMessages = async (conversationId, limit = 50, offset = 0) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId: parseInt(conversationId),
        isDeleted: false,
      },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Orden cronológico (más viejos arriba, nuevos abajo para el chat)
      },
      take: limit,
      skip: offset,
    });

    return messages; 
  } catch (error) {
    console.error('❌ Error getting messages:', error);
    throw error;
  }
};

/**
 * Marcar mensaje como leído
 */
const markMessageAsRead = async (messageId, userId) => {
  try {
    // Verificar que el mensaje sea para este usuario
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        receiverId: userId,
        isRead: false,
      },
    });

    if (!message) {
      return null; 
    }

    return await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Error marking message as read:', error);
    throw error;
  }
};

/**
 * Marcar todos los mensajes de una conversación como leídos
 */
const markAllMessagesAsRead = async (conversationId, userId) => {
  try {
    return await prisma.message.updateMany({
      where: {
        conversationId: parseInt(conversationId),
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Error marking all messages as read:', error);
    throw error;
  }
};

/**
 * Obtener conteo de mensajes no leídos por conversación
 */
const getUnreadCount = async (conversationId, userId) => {
  try {
    return await prisma.message.count({
      where: {
        conversationId: parseInt(conversationId),
        receiverId: userId,
        isRead: false,
        isDeleted: false,
      },
    });
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    throw error;
  }
};

/**
 * Eliminar mensaje (soft delete)
 */
const deleteMessage = async (messageId, userId) => {
  try {
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        senderId: userId,
      },
    });

    if (!message) {
      throw new Error('Message not found or unauthorized');
    }

    return await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    throw error;
  }
};

/**
 * Buscar mensajes en una conversación
 */
const searchMessages = async (conversationId, searchTerm, limit = 20) => {
  try {
    return await prisma.message.findMany({
      where: {
        conversationId: parseInt(conversationId),
        content: {
          contains: searchTerm,
        },
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  } catch (error) {
    console.error('❌ Error searching messages:', error);
    throw error;
  }
};

module.exports = {
  createMessage,
  getConversationMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadCount,
  deleteMessage,
  searchMessages,
};