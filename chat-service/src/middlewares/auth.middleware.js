// src/middlewares/auth.middleware.js
const axios = require('axios');

/**
 * Middleware de autenticación
 * Verifica el JWT token con el auth-service
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    
    const token = authHeader.substring(7); // Remover "Bearer "
    
    try {
      // Llamar a auth-service para verificar token
      const response = await axios.post(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
        { token },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 
        }
      );
      
      // Extraer user de la respuesta
      req.user = response.data.data.user;
      req.userId = req.user.id; // Para mantener compatibilidad
      
      console.log('✅ Chat Service - User authenticated:', req.user.username || req.user.email);
      
      next();
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }
      
      console.error('❌ Error connecting to auth-service:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Authentication service unavailable',
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = { authMiddleware };