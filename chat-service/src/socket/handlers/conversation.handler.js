// chat-service/src/socket/handlers/conversation.handler.js

const registerConversationHandlers = (io, socket) => {
  
  /**
   * Evento: join_conversation
   * El usuario entra a la sala de un chat específico para escuchar mensajes en tiempo real.
   */
  socket.on('join_conversation', (conversationId) => {
    if (!conversationId) return;
    
    const roomName = `conversation:${conversationId}`;
    
    // Salir de otras salas de conversación (opcional, para evitar ruido)
    // socket.rooms.forEach(room => {
    //   if (room.startsWith('conversation:') && room !== roomName) {
    //     socket.leave(room);
    //   }
    // });

    socket.join(roomName);
    console.log(`🔌 Socket ${socket.id} (User: ${socket.userId}) se unió a la sala: ${roomName}`);
  });

  /**
   * Evento: leave_conversation
   */
  socket.on('leave_conversation', (conversationId) => {
    if (!conversationId) return;
    const roomName = `conversation:${conversationId}`;
    socket.leave(roomName);
  });

  /**
   * Evento: typing_start
   * Ahora lo emitimos a la SALA, no al usuario específico. Es más seguro.
   */
  socket.on('typing_start', ({ conversationId }) => {
    const roomName = `conversation:${conversationId}`;
    // Emitir a todos en la sala MENOS a mí mismo
    socket.to(roomName).emit('user_typing', { 
        conversationId, 
        userId: socket.userId, 
        isTyping: true 
    });
  });

  /**
   * Evento: typing_stop
   */
  socket.on('typing_stop', ({ conversationId }) => {
    const roomName = `conversation:${conversationId}`;
    socket.to(roomName).emit('user_typing', { 
        conversationId, 
        userId: socket.userId, 
        isTyping: false 
    });
  });
};

module.exports = { registerConversationHandlers };