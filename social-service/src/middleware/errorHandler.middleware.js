// social-service/src/middleware/errorHandler.middleware.js

/**
 * Middleware global para manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error capturado:', err);

  // Errores de Prisma
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          message: 'Ya existe un registro con estos datos',
          field: err.meta?.target?.[0] || 'unknown',
        });

      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado',
        });

      case 'P2003':
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida en la base de datos',
        });

      default:
        return res.status(500).json({
          success: false,
          message: 'Error en la base de datos',
          code: err.code,
        });
    }
  }

  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: err.errors,
    });
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
};

module.exports = {
  errorHandler,
  notFound,
};