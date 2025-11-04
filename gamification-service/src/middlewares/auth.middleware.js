// gamification-service/src/middlewares/auth.middleware.js

const axios = require('axios');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const response = await axios.post(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
        { token },
        { timeout: 5000 }
      );
      
      req.user = response.data.data.user;
      next();
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }
      
      console.error('Error connecting to auth-service:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Authentication service unavailable',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ✅ NUEVO: Middleware para validar requests entre servicios
const validateServiceKey = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  
  if (!serviceKey || serviceKey !== process.env.SERVICE_API_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Invalid service key'
    });
  }
  
  next();
};

module.exports = { 
  authenticate,
  validateServiceKey 
};