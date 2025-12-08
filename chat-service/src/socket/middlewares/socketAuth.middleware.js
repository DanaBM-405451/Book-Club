// src/socket/middlewares/socketAuth.middleware.js
const axios = require('axios');

/**
 * Middleware de autenticación para Socket.io
 * Verifica el token JWT con auth-service
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    // Verificar token con auth-service
    try {
      const response = await axios.post(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
        { token },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 
        }
      );

      // Adjuntar user al socket
      socket.user = response.data.data.user;
      socket.userId = socket.user.id;
      
      console.log(`✅ Socket authenticated: ${socket.user.username || socket.user.email} (${socket.userId})`);
      next();
    } catch (error) {
      if (error.response?.status === 401) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }
      
      console.error('❌ Auth-service error:', error.message);
      return next(new Error('Authentication error: Service unavailable'));
    }
  } catch (error) {
    console.error('❌ Socket authentication failed:', error.message);
    next(new Error('Authentication error'));
  }
};

module.exports = { socketAuthMiddleware };