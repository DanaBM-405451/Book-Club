// src/socket/handlers/message.handler.js (CON VALIDACIÓN)
const messageService = require('../../services/message.service');
const conversationService = require('../../services/conversation.service');
const { validateSocketPayload, sendMessageSchema } = require('../../utils/validators');

const registerMessageHandlers = (io, socket) => {
  
  socket.on('send_message', async (payload, callback) => {
    console.log(`📩 Recibido evento send_message de ${socket.userId || 'Usuario'}`);

    // 1. Validación básica del payload
    const validation = validateSocketPayload(sendMessageSchema, payload);
    
    // Nota: Aunque falle la validación estricta, intentamos recuperar datos si es posible
    let { conversationId, content, tempId, receiverId } = payload;
    const senderId = socket.userId || payload.senderId;

    try {
      // 🛡️ BLINDAJE: Si no tenemos conversationId, lo buscamos usando los participantes
      if (!conversationId && receiverId) {
          console.log("⚠️ ConversationId faltante, recuperándolo...");
          const conv = await conversationService.getOrCreateConversation(senderId, receiverId);
          conversationId = conv.id;
      }

      // Si aún así no tenemos ID, no podemos seguir
      if (!conversationId) {
          throw new Error("No se pudo determinar el ID de la conversación");
      }

      // 2. Guardar Mensaje en BD
      const message = await messageService.createMessage(
        parseInt(conversationId), // Aseguramos que sea entero
        senderId,
        receiverId, 
        content,
        null
      );

      // 3. Actualizar metadata de la conversación
      await conversationService.updateConversationLastMessage(conversationId, content);
      
      // 4. Incrementar contador de no leídos para el receptor
      if (receiverId) {
          await conversationService.incrementUnreadCount(conversationId, receiverId);
      }

      const messagePayload = {
        ...message,
        tempId 
      };

      // 5. EMISIÓN REAL-TIME
      // Emitir a la sala de la conversación (ambos usuarios)
      io.to(`conversation:${conversationId}`).emit('new_message', messagePayload);
      
      // Notificación global al usuario receptor (para actualizar lista de chats si está fuera)
      if (receiverId) {
          io.to(`user:${receiverId}`).emit('notification_message', messagePayload);
      }

      // 6. Callback de éxito
      if (typeof callback === 'function') {
        callback({ success: true, data: messagePayload });
      }

      console.log(`✅ Mensaje guardado y emitido en chat ${conversationId}`);

    } catch (error) {
      console.error('❌ Error crítico en send_message:', error.message);
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Error interno al enviar mensaje' });
      }
    }
  });

  // --- Typing Handlers (Sin cambios) ---
  socket.on('typing_start', ({ conversationId, receiverId }) => {
     if(receiverId) socket.to(`user:${receiverId}`).emit('user_typing', { conversationId, userId: socket.userId, isTyping: true });
  });

  socket.on('typing_stop', ({ conversationId, receiverId }) => {
     if(receiverId) socket.to(`user:${receiverId}`).emit('user_typing', { conversationId, userId: socket.userId, isTyping: false });
  });
};

module.exports = { registerMessageHandlers };