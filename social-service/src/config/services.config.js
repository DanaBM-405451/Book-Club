// src/config/services.config.js

/**
 * Configuración de URLs de servicios externos
 */
module.exports = {
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  LIBRARY_SERVICE_URL: process.env.LIBRARY_SERVICE_URL || 'http://localhost:3003',
  GAMIFICATION_SERVICE_URL: process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004'
};