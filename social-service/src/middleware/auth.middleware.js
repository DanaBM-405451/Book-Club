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
      // ✅ Llamar a auth-service igual que los demás servicios
      const response = await axios.post(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
        { token }, // ✅ Token en el body
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 
        }
      );
      
      // ✅ Extraer user de la respuesta
      req.user = response.data.data.user;
      req.user.userId = req.user.id;
      
      // 🔍 DEBUG (opcional, puedes comentarlo después)
      console.log('✅ User authenticated:', req.user);
      
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

/**
 * Middleware para requerir rol de ADMIN
 * (ESTE ES EL QUE FALTABA)
 */
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
  authMiddleware, 
  requireAdmin
};


//const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar JWT y extraer información del usuario
 */
/*
const authMiddleware = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Extraer token
    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Error en autenticación:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error en autenticación'
    });
  }
};

/**
 * Middleware opcional - no falla si no hay token
 */
/*
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role
      };
    }
    
    next();
  } catch (error) {
    // Ignorar errores en auth opcional
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };

// social-service/src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar JWT y extraer userId
 */
/*
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar userId al request
    req.userId = decoded.userId || decoded.id;
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    console.error('Error verificando token:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
  }
};

/**
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId || decoded.id;
      req.user = decoded;
      req.token = token;
    }

    next();
  } catch (error) {
    // Ignorar errores en auth opcional
    next();
  }
};

module.exports = {
  verifyToken,
  optionalAuth,
};*/