// src/socket/handlers/message.handler.js (CON VALIDACIÓN)
const messageService = require('../../services/message.service');
const conversationService = require('../../services/conversation.service');
const { checkFriendship } = require('../../services/http/social.service');
const { 
  sendMessageSchema, 
  markAsReadSchema, 
  deleteMessageSchema,
  validateSocketPayload 
} = require('../../utils/validators');

/**
 * Registrar manejadores de eventos de mensajes
 */
const registerMessageHandlers = (io, socket) => {
  
  /**
   * Evento: send_message
   */
  socket.on('send_message', async (payload, callback) => {
    try {
      // Validar payload
      const validation = validateSocketPayload(sendMessageSchema, payload);
      if (!validation.isValid) {
        return callback({
          success: false,
          message: 'Datos inválidos',
          errors: validation.errors,
        });
      }

      const senderId = socket.userId;
      const { receiverId, content, replyToId } = validation.value;

      // Verificar que sean amigos
      /*try {
        const friendshipResponse = await checkFriendship(
          senderId,
          receiverId,
          socket.handshake.auth.token
        );

        if (!friendshipResponse.success || friendshipResponse.data.status !== 'ACCEPTED') {
          return callback({
            success: false,
            message: 'Solo puedes enviar mensajes a tus amigos',
          });
        }
      } catch (error) {
        console.error('❌ Error verificando amistad:', error.message);
        
        if (process.env.NODE_ENV !== 'development') {
          return callback({
            success: false,
            message: 'Error verificando relación de amistad',
          });
        }
      }*/

      // Obtener o crear conversación
      const conversation = await conversationService.getOrCreateConversation(
        senderId,
        receiverId
      );

      // Crear mensaje
      const message = await messageService.createMessage(
        conversation.id,
        senderId,
        receiverId,
        content,
        replyToId
      );

      // Actualizar conversación
      await conversationService.updateConversationLastMessage(
        conversation.id,
        content
      );

      // Incrementar contador no leídos
      await conversationService.incrementUnreadCount(conversation.id, receiverId);

      const messagePayload = {
        id: message.id,
        conversationId: conversation.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        replyTo: message.replyTo,
        isRead: message.isRead,
        createdAt: message.createdAt,
      };

      // Emitir al receptor
      io.to(`user:${receiverId}`).emit('new_message', messagePayload);

      // Confirmar al emisor
      callback({
        success: true,
        data: messagePayload,
      });

      console.log(`✅ Message sent: ${senderId} -> ${receiverId}`);
    } catch (error) {
      console.error('❌ Error en send_message:', error);
      callback({
        success: false,
        message: 'Error enviando mensaje',
      });
    }
  });

  /**
   * Evento: mark_as_read
   */
  socket.on('mark_as_read', async (payload, callback) => {
    try {
      const validation = validateSocketPayload(markAsReadSchema, payload);
      if (!validation.isValid) {
        return callback({
          success: false,
          errors: validation.errors,
        });
      }

      const userId = socket.userId;
      const { messageId, conversationId } = validation.value;

      if (messageId) {
        await messageService.markMessageAsRead(messageId, userId);
      } else if (conversationId) {
        await messageService.markAllMessagesAsRead(conversationId, userId);
        await conversationService.markConversationAsRead(conversationId, userId);
      }

      callback({
        success: true,
        message: 'Marcado como leído',
      });
    } catch (error) {
      console.error('❌ Error en mark_as_read:', error);
      callback({
        success: false,
        message: 'Error marcando como leído',
      });
    }
  });

  /**
   * Evento: delete_message
   */
  socket.on('delete_message', async (payload, callback) => {
    try {
      const validation = validateSocketPayload(deleteMessageSchema, payload);
      if (!validation.isValid) {
        return callback({
          success: false,
          errors: validation.errors,
        });
      }

      const userId = socket.userId;
      const { messageId } = validation.value;

      await messageService.deleteMessage(messageId, userId);

      callback({
        success: true,
        message: 'Mensaje eliminado',
      });
    } catch (error) {
      console.error('❌ Error en delete_message:', error);
      callback({
        success: false,
        message: error.message || 'Error eliminando mensaje',
      });
    }
  });
};

module.exports = { registerMessageHandlers };
