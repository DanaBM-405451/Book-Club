// src/socket/handlers/typing.handler.js
const { prisma } = require('../../config/database');

/**
 * Registrar manejadores de indicador "escribiendo..."
 */
const registerTypingHandlers = (io, socket) => {
  
  /**
   * Evento: typing_start
   * Descripción: Usuario comienza a escribir
   * Payload: { conversationId, receiverId }
   */
  socket.on('typing_start', async (payload) => {
    try {
      const userId = socket.userId;
      const { conversationId, receiverId } = payload;

      if (!conversationId || !receiverId) {
        return;
      }

      // Actualizar o crear indicador de typing
      await prisma.typingIndicator.upsert({
        where: {
          conversationId_userId: {
            conversationId: parseInt(conversationId),
            userId,
          },
        },
        update: {
          isTyping: true,
          lastTypingAt: new Date(),
        },
        create: {
          conversationId: parseInt(conversationId),
          userId,
          isTyping: true,
          lastTypingAt: new Date(),
        },
      });

      // Emitir al receptor
      io.to(`user:${receiverId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: true,
      });

      console.log(`⌨️ User ${userId} is typing in conversation ${conversationId}`);
    } catch (error) {
      console.error('❌ Error en typing_start:', error);
    }
  });

  /**
   * Evento: typing_stop
   * Descripción: Usuario deja de escribir
   * Payload: { conversationId, receiverId }
   */
  socket.on('typing_stop', async (payload) => {
    try {
      const userId = socket.userId;
      const { conversationId, receiverId } = payload;

      if (!conversationId || !receiverId) {
        return;
      }

      // Actualizar indicador de typing
      await prisma.typingIndicator.updateMany({
        where: {
          conversationId: parseInt(conversationId),
          userId,
        },
        data: {
          isTyping: false,
        },
      });

      // Emitir al receptor
      io.to(`user:${receiverId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false,
      });

      console.log(`⌨️ User ${userId} stopped typing in conversation ${conversationId}`);
    } catch (error) {
      console.error('❌ Error en typing_stop:', error);
    }
  });
};

module.exports = { registerTypingHandlers };