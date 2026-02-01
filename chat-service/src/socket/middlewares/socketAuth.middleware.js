const axios = require('axios');

const socketAuthMiddleware = async (socket, next) => {
  try {
    // 🔍 Búsqueda exhaustiva del token
    const token = 
        socket.handshake.auth?.token || 
        socket.handshake.query?.token || 
        socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      console.error('❌ Socket Auth: Token no encontrado en handshake');
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
      
      // console.log(`✅ Socket authenticated: ${socket.user.username}`);
      next();
    } catch (error) {
      console.error('❌ Auth-service error:', error.message);
      return next(new Error('Authentication error: Invalid Token'));
    }
  } catch (error) {
    console.error('❌ Socket middleware failed:', error.message);
    next(new Error('Internal Authentication Error'));
  }
};

module.exports = { socketAuthMiddleware };