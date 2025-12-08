// src/server.js

/**
 * PROPÓSITO:
 * - Punto de entrada del email-service
 * - Configurar Express
 * - Conectar a base de datos
 * - Verificar conexión SMTP
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyConnection } = require('./config/email.config');
const emailRoutes = require('./routes/email.routes');

const app = express();
const PORT = process.env.PORT || 5006;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'email-service' });
});

// Routes
app.use('/api/email', emailRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  });
});

// Start server
const startServer = async () => {
  try {
    // Verificar conexión SMTP
    const smtpConnected = await verifyConnection();
    if (!smtpConnected) {
      console.warn('⚠️  SMTP connection failed, but server will start anyway');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Email Service running on port ${PORT}`);
      console.log(`📧 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();