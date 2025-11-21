// src/index.js
require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');

/**
 * Punto de entrada del Social Service
 */

const PORT = process.env.PORT || 3005;

/**
 * Iniciar servidor
 */
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Social Service corriendo en puerto ${PORT}`);
      console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Error iniciando Social Service:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! 💥 Cerrando servidor...');
  console.error(err.name, err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! 💥 Cerrando servidor...');
  console.error(err.name, err.message);
  process.exit(1);
});


/*

// social-service/src/index.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const friendshipRoutes = require('./routes/friendship.routes');
const groupRoutes = require('./routes/group.routes');
const postRoutes = require('./routes/post.routes');
const goalRoutes = require('./routes/goal.routes');
const proposalRoutes = require('./routes/proposal.routes');
const challengeRoutes = require('./routes/challenge.routes');
const notificationRoutes = require('./routes/notification.routes');
const searchRoutes = require('./routes/search.routes');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3005;

// =====================================================
// MIDDLEWARES
// =====================================================

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'social-service',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// RUTAS
// =====================================================

app.use('/api/social/search', searchRoutes);
app.use('/api/social/friends', friendshipRoutes);
app.use('/api/social/groups', groupRoutes);
app.use('/api/social/posts', postRoutes);
app.use('/api/social/goals', goalRoutes);
app.use('/api/social/proposals', proposalRoutes);
app.use('/api/social/challenges', challengeRoutes);
app.use('/api/social/notifications', notificationRoutes);

// =====================================================
// ERROR HANDLING
// =====================================================

app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(`🚀 Social Service running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Auth Service: ${process.env.AUTH_SERVICE_URL}`);
});

module.exports = app;

*/