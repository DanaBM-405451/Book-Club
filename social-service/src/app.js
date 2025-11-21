// src/app.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

/**
 * Configuración de la aplicación Express
 */

const app = express();

// =====================================================
// MIDDLEWARES GLOBALES
// =====================================================

// CORS - Permitir peticiones desde el frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser - Parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger - Solo en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'social-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// RUTAS
// =====================================================

// Importar rutas
const usersRoutes = require('./routes/users.routes.js');
const friendsRoutes = require('./routes/friends.routes.js');
const groupsRoutes = require('./routes/groups.routes.js');
const forumRoutes = require('./routes/forum.routes.js');
const goalsRoutes = require('./routes/goals.routes.js');
const proposalsRoutes = require('./routes/proposals.routes.js');
const challengesRoutes = require('./routes/challenges.routes.js');

// ✅ Montar rutas con prefijo /api/social
app.use('/api/social/users', usersRoutes);
app.use('/api/social/friends', friendsRoutes);
app.use('/api/social/groups', groupsRoutes);
app.use('/api/social/groups', forumRoutes);
app.use('/api/social/groups', goalsRoutes);
app.use('/api/social/groups', proposalsRoutes);
app.use('/api/social/groups', challengesRoutes);


/*
// =====================================================
// RUTAS
// =====================================================

// Importar rutas
const usersRoutes = require('./routes/users.routes.js');
const friendsRoutes = require('./routes/friends.routes.js');
const groupsRoutes = require('./routes/groups.routes.js');
const forumRoutes = require('./routes/forum.routes.js');
const goalsRoutes = require('./routes/goals.routes.js');
const proposalsRoutes = require('./routes/proposals.routes.js');
const challengesRoutes = require('./routes/challenges.routes.js');

// Montar rutas principales
app.use('/users', usersRoutes);           // Historia 5.1: /users/search, /users/:userId
app.use('/friends', friendsRoutes);       // Historia 5.2: /friends/request, /friends, etc.

// Montar rutas de grupos (todas bajo /groups)
app.use('/groups', groupsRoutes);         // Historia 5.3: /groups, /groups/:groupId, etc.
app.use('/groups', forumRoutes);          // Historia 5.4: /groups/:groupId/posts
app.use('/groups', goalsRoutes);          // Historia 5.5: /groups/:groupId/goals
app.use('/groups', proposalsRoutes);      // Historia 5.6: /groups/:groupId/proposals
app.use('/groups', challengesRoutes);     // Historia 5.7: /groups/:groupId/challenges
*/
// =====================================================
// MANEJO DE RUTAS NO ENCONTRADAS
// =====================================================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada en social-service`
  });
});

// =====================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =====================================================

const { errorHandler } = require('./middleware/errorHandler.middleware');
app.use(errorHandler);

module.exports = app;
/*
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

/**
 * Configuración de la aplicación Express
 */
/*
const app = express();

// =====================================================
// MIDDLEWARES GLOBALES
// =====================================================

// CORS - Permitir peticiones desde el frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser - Parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger - Solo en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'social-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// RUTAS
// =====================================================

// Importar rutas (las crearemos después)
const usersRoutes = require('./routes/users.routes');
const friendsRoutes = require('./routes/friends.routes');
const groupsRoutes = require('./routes/groups.routes');
const forumRoutes = require('./routes/forum.routes');
const goalsRoutes = require('./routes/goals.routes');
const proposalsRoutes = require('./routes/proposals.routes');
const challengesRoutes = require('./routes/challenges.routes');

// Montar rutas
app.use('/users', usersRoutes);           // Historia 5.1
app.use('/friends', friendsRoutes);       // Historia 5.2
app.use('/groups', groupsRoutes);         // Historia 5.3
app.use('/forum', forumRoutes);           // Historia 5.4
app.use('/goals', goalsRoutes);           // Historia 5.5
app.use('/proposals', proposalsRoutes);   // Historia 5.6
app.use('/challenges', challengesRoutes); // Historia 5.7

// =====================================================
// MANEJO DE RUTAS NO ENCONTRADAS
// =====================================================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada en social-service`
  });
});

// =====================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =====================================================

const errorHandler = require('./middleware/errorHandler.middleware');
app.use(errorHandler);

module.exports = app;
*/