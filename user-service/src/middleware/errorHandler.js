// user-service/src/middlewares/errorHandler.js

/**
 * PROPÓSITO:
 * - Capturar TODOS los errores de la aplicación en un solo lugar
 * - Dar respuestas consistentes al frontend
 * - Loguear errores para debugging
 * - NO exponer detalles internos al usuario
 * 
 * FLUJO:
 * 1. Un error ocurre en cualquier parte (controller, service, middleware)
 * 2. Se lanza con throw new Error() o next(error)
 * 3. Express automáticamente lo envía a este middleware
 * 4. Este middleware procesa el error y devuelve respuesta apropiada
 * 
 * IMPORTANTE:
 * Este middleware DEBE ir al final de todas las rutas en index.js
 */

const errorHandler = (err, req, res, next) => {
  // Loguear error completo en consola (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', err);
  }
  
  // Loguear solo el mensaje en producción
  console.error('Error:', err.message);
  
  /**
   * ERRORES DE PRISMA
   * Prisma lanza errores con códigos específicos
   * Documentación: https://www.prisma.io/docs/reference/api-reference/error-reference
   */
  
  // P2002: Unique constraint violation
  // Ejemplo: intentar crear perfil con userId que ya existe
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Este recurso ya existe',
      field: err.meta?.target // Campo que causa el conflicto
    });
  }
  
  // P2025: Record not found
  // Ejemplo: intentar actualizar perfil que no existe
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Recurso no encontrado'
    });
  }
  
  // P2003: Foreign key constraint failed
  // Ejemplo: intentar crear perfil con userId que no existe en auth_db
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Relación inválida entre recursos'
    });
  }
  
  /**
   * ERRORES DE MULTER (upload de archivos)
   */
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'El archivo es demasiado grande. Máximo 5MB'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Campo de archivo inesperado'
    });
  }
  
  /**
   * ERRORES DE VALIDACIÓN
   * Ya se manejan en validators.js, pero por si acaso
   */
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.details || err.message
    });
  }
  
  /**
   * ERRORES DE CLOUDINARY
   */
  if (err.message && err.message.includes('Cloudinary')) {
    return res.status(500).json({
      success: false,
      message: 'Error al subir imagen. Intenta de nuevo'
    });
  }
  
  /**
   * ERROR GENÉRICO
   * Para cualquier otro error no manejado específicamente
   */
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? message : 'Error interno del servidor',
    // En desarrollo, enviar stack trace
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};


module.exports = errorHandler;