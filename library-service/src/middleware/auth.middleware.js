// library-service/src/middleware/auth.middleware.js

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

      // ✅ ASEGURARSE QUE req.user TIENE toda la info (incluido role)
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

// ✅ ESTA ES LA FUNCIÓN QUE FALTABA
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.',
    });
  }

  next();
};

// ✅ Asegúrate de exportar AMBAS
module.exports = { authenticate, requireAdmin };

/*
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
      // Verificar con auth-service
      const response = await axios.post(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
        { token },
        { timeout: 5000 }
      );

      // ✅ Guardamos el usuario completo (incluyendo role)
      req.user = response.data.data.user;
      
      // DEBUG: Confirmar que trae el rol
      // console.log('✅ User authenticated:', req.user.role);
      
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

// ✅ NUEVO: Middleware para proteger rutas de administrador
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.',
    });
  }

  next();
};

module.exports = { 
  authenticate, 
  requireAdmin 
};
*/