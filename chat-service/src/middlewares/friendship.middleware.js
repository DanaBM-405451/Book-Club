// src/middlewares/friendship.middleware.js
const axios = require('axios');

/**
 * Middleware para verificar si dos usuarios son amigos
 * Consulta al social-service
 */
const verifyFriendship = async (req, res, next) => {
  try {
    const userId = req.user.id; // Desde authMiddleware
    const friendId = req.params.friendId || req.body.receiverId;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: 'ID del amigo no proporcionado',
      });
    }

    // No permitir chat con uno mismo
    if (userId === friendId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes chatear contigo mismo',
      });
    }

    // Consultar a social-service si son amigos
    const socialServiceUrl = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3005';
    
    try {
      const response = await axios.get(
        `${socialServiceUrl}/api/friendships/check/${friendId}`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
          timeout: 5000,
        }
      );

      // Verificar que la respuesta sea exitosa y la amistad esté aceptada
      if (!response.data.success) {
        return res.status(403).json({
          success: false,
          message: 'No tienes una amistad activa con este usuario',
        });
      }

      // Verificar que el status sea ACCEPTED
      const friendship = response.data.data;
      if (friendship.status !== 'ACCEPTED') {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes chatear con usuarios que sean tus amigos',
          friendshipStatus: friendship.status,
        });
      }

      // Adjuntar información de amistad al request
      req.friendship = friendship;
      
      console.log(`✅ Friendship verified: ${userId} <-> ${friendId}`);
      next();
    } catch (axiosError) {
      // Si es un 404, significa que no son amigos
      if (axiosError.response?.status === 404) {
        return res.status(403).json({
          success: false,
          message: 'No eres amigo de este usuario',
        });
      }

      console.error('❌ Error consultando social-service:', axiosError.message);
      
      // Si el servicio no está disponible, denegar acceso en producción
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          success: false,
          message: 'Error verificando amistad. Servicio no disponible',
        });
      }

      // En desarrollo, permitir (fail-open para testing)
      console.warn('⚠️ Social-service no disponible, permitiendo acceso (DEV MODE)');
      next();
    }
  } catch (error) {
    console.error('❌ Error en middleware de amistad:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando relación de amistad',
    });
  }
};

module.exports = { verifyFriendship };