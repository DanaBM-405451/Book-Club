// src/index.js (VERSIÓN FINAL)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { connectDB } = require('./config/database');
const { configureSocketIO } = require('./config/socket');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Importar rutas
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');

// Importar handlers de Socket.io
const { registerMessageHandlers } = require('./socket/handlers/message.handler');
const { registerTypingHandlers } = require('./socket/handlers/typing.handler');
const { registerConnectionHandlers } = require('./socket/handlers/connection.handler');

const app = express();
const server = http.createServer(app);

// Configurar Socket.io
const io = configureSocketIO(server);

// Hacer io accesible en toda la app
app.set('io', io);

// =====================================================
// MIDDLEWARES
// =====================================================
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// =====================================================
// HEALTH CHECK
// =====================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'chat-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// RUTAS REST
// =====================================================
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

// =====================================================
// SOCKET.IO HANDLERS
// =====================================================
io.on('connection', (socket) => {
  // Registrar todos los manejadores
  registerMessageHandlers(io, socket);
  registerTypingHandlers(io, socket);
  registerConnectionHandlers(io, socket);
});

// =====================================================
// MANEJO DE ERRORES
// =====================================================
app.use(notFoundHandler);      // 404
app.use(errorHandler);         // Errores globales

// =====================================================
// INICIAR SERVIDOR
// =====================================================
const PORT = process.env.PORT || 3020;

const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    // Crear carpeta de logs si no existe
    const fs = require('fs');
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs');
    }
    
    // Iniciar servidor HTTP
    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║         🚀 CHAT SERVICE INICIADO 🚀              ║
╠═══════════════════════════════════════════════════╣
║  Puerto HTTP:        ${PORT}                        ║
║  Socket.io:          ${process.env.SOCKET_IO_PATH || '/socket.io'}                  ║
║  Entorno:            ${process.env.NODE_ENV}     ║
║  Base de datos:      MySQL (chat_db)             ║
╚═══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };