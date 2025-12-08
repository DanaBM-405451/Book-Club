// src/middlewares/errorHandler.js

/**
 * Middleware global para manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error capturado:', err);

  // Error de validación de Joi
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.details?.map(d => d.message) || [err.message],
    });
  }

  // Error de Prisma (BD)
  if (err.code?.startsWith('P')) {
    let message = 'Error en la base de datos';
    
    switch (err.code) {
      case 'P2002':
        message = 'Ya existe un registro con esos datos';
        break;
      case 'P2025':
        message = 'Registro no encontrado';
        break;
      case 'P2003':
        message = 'Error de relación en la base de datos';
        break;
      default:
        message = `Error de base de datos: ${err.code}`;
    }

    return res.status(400).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
    });
  }

  // Error personalizado con status
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    }),
  });
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};