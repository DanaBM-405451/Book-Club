// social-service/src/utils/gamification.utils.js
const axios = require('axios');

const notifyActivity = async (userId) => {
  try {
    // URL del User Service (donde creamos el logActivity)
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
    
    // Llamamos al endpoint de actividad
    await axios.post(`${userServiceUrl}/api/users/activity`, { userId });
    
    console.log(`🎮 Actividad registrada para usuario ${userId}`);
  } catch (error) {
    // No lanzamos error para no bloquear la funcionalidad principal si el servicio de usuarios falla
    console.error('⚠️ Error notificando gamificación:', error.message);
  }
};

module.exports = { notifyActivity };