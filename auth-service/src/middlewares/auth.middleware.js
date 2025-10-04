const { verifyToken } = require('../utils/jwt.utils');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'El token no fue provisto'
      });
    }
    
    const token = authHeader.substring(7);
    
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message === 'Token expirado' ? 'Token expirado' : 'Token invalido'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o invalido'
      });
    }
    
    req.user = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Fallo la autenticacion'
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No  autenticado'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'permisos insuficientes'
      });
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };