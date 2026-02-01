//chat-service/src/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { socketAuthMiddleware } = require('./socket/middlewares/socketAuth.middleware');

// Rutas
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');

// Handlers
const { registerMessageHandlers } = require('./socket/handlers/message.handler');
const { registerConnectionHandlers } = require('./socket/handlers/connection.handler');
// ✅ NUEVO: Importamos el handler de conversaciones
const { registerConversationHandlers } = require('./socket/handlers/conversation.handler'); 

const app = express();
const server = http.createServer(app);
app.set('etag', false);

// ==========================================
// ⚡ CONFIGURACIÓN SOCKET.IO
// ==========================================
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:4000"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization"]
  },
  path: '/socket.io',
  transports: ['websocket', 'polling']
});
app.set('io', io);

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Middleware Auth Socket
io.use(socketAuthMiddleware);

// Evento Conexión
io.on('connection', (socket) => {
  let userId = socket.userId;
  
  // Fallback de ID (Tu lógica actual)
  if (!userId) {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (token) {
          try {
              const jwt = require('jsonwebtoken');
              const decoded = jwt.decode(token);
              userId = decoded?.userId || decoded?.id;
          } catch (e) { console.error("Error decodificando token manual:", e); }
      }
  }

  if (!userId) {
      console.warn("⚠️ Usuario sin ID conectado. Usando ID temporal 'test-user'");
      userId = 'test-user'; 
      socket.userId = userId;
  }

  const username = socket.user?.username || 'User';

  console.log(`🔌 SOCKET CONECTADO: ${username} (ID: ${userId}) | SocketID: ${socket.id}`);

  // ✅ VITAL: Unir al usuario a su propia sala de notificaciones
  // Sin esto, los mensajes directos (io.to(`user:${receiverId}`)) fallarán si no está en el chat.
  socket.join(`user:${userId}`);

  // ✅ Registrar handlers (Nota: Quitamos registerTypingHandlers porque ahora lo maneja conversation)
  registerMessageHandlers(io, socket);
  registerConversationHandlers(io, socket); // <--- NUEVO
  registerConnectionHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`❌ SOCKET DESCONECTADO: ${username}`);
  });
});

// ==========================================
// CONFIGURACIÓN EXPRESS
// ==========================================
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:4000"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'chat-service' }));
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3020;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`
      🚀 CHAT SERVICE corriendo en puerto ${PORT}
      📡 Socket.io listo en /socket.io
      `);
    });
  } catch (error) {
    console.error('Fatal Error:', error);
  }
};

startServer();
module.exports = { io };