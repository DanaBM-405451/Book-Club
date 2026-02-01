// chat-service/src/config/socket.js
const { Server } = require('socket.io');

const configureSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      // Permitir Frontend (3000) y Gateway (4000)
      origin: ["http://localhost:3000", "http://localhost:4000"],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Authorization"]
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  return io;
};

module.exports = { configureSocketIO };