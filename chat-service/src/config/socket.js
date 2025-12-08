// src/config/socket.js (ACTUALIZADO)
const { Server } = require('socket.io');
const { socketAuthMiddleware } = require('../socket/middlewares/socketAuth.middleware');

/**
 * Configurar Socket.io con autenticación vía auth-service
 * @param {http.Server} server - Servidor HTTP de Express
 * @returns {Server} - Instancia de Socket.io
 */
const configureSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: process.env.SOCKET_IO_PATH || '/socket.io',
    pingTimeout: parseInt(process.env.SOCKET_IO_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.SOCKET_IO_PING_INTERVAL) || 25000,
  });

  // Aplicar middleware de autenticación
  io.use(socketAuthMiddleware);

  // Evento de conexión
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.username || socket.userId} (Socket ID: ${socket.id})`);

    // Unir al usuario a su sala personal (para recibir mensajes privados)
    socket.join(`user:${socket.userId}`);

    // Evento de desconexión
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.userId} (Reason: ${reason})`);
    });
  });

  return io;
};

module.exports = { configureSocketIO };