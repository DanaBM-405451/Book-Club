// src/socket/handlers/connection.handler.js

/**
 * Registrar manejadores de conexión/desconexión
 */
const registerConnectionHandlers = (io, socket) => {
  
  /**
   * Evento: user_online
   * Cuando un usuario se conecta
   */
  socket.on('user_online', () => {
    const userId = socket.userId;
    
    // Notificar a todos los sockets del usuario (múltiples dispositivos)
    io.emit('user_status_changed', {
      userId,
      status: 'online',
      lastSeenAt: new Date(),
    });

    console.log(`🟢 User ${userId} is online`);
  });

  /**
   * Desconexión
   */
  socket.on('disconnect', () => {
    const userId = socket.userId;
    
    // Verificar si el usuario tiene otros sockets conectados
    const userSockets = Array.from(io.sockets.sockets.values())
      .filter(s => s.userId === userId);

    // Si no tiene más sockets, marcar como offline
    if (userSockets.length === 0) {
      io.emit('user_status_changed', {
        userId,
        status: 'offline',
        lastSeenAt: new Date(),
      });

      console.log(`🔴 User ${userId} is offline`);
    }
  });
};

module.exports = { registerConnectionHandlers };