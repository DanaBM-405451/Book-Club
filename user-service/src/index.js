// user-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.route.js'); 
const errorHandler = require('./middleware/errorHandler.js'); 

const app = express();
const PORT = process.env.PORT || 3002;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

app.use(cors({
  origin: [
    process.env.GATEWAY_URL || 'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:4000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// ROUTES
// ============================================

app.use('/api/users', userRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// Error handler (DEBE ir al final)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        👤 USER SERVICE RUNNING                 ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}           ║
║                                                ║
║  Routes:                                       ║
║  ├─ GET    /api/users/:userId                  ║
║  ├─ GET    /api/users/profile                  ║
║  ├─ PUT    /api/users/profile                  ║
║  ├─ POST   /api/users/profile/avatar           ║
║  ├─ PUT    /api/users/profile/avatar/default   ║
║  ├─ GET    /api/users/notifications/settings   ║
║  ├─ PUT    /api/users/notifications/settings   ║
║  ├─ PUT    /api/users/change-password          ║
║  └─ DELETE /api/users/account                  ║
║                                                ║
║  Health: http://localhost:${PORT}/health        ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;

/*
require('dotenv').config();
const express = require('express');
const cors = require('cors');
//const userRoutes = require('./routes/user.route.js');
//const errorHandler = require('./middleware/errorHandler.js').default;
const userRoutes = require('./routes/user.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares globales
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
// ✅ CORRECTO
app.use(cors({
  origin: [
    process.env.GATEWAY_URL || 'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:4000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/users', userRoutes);

// Error handler (DEBE ir al final)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
*/