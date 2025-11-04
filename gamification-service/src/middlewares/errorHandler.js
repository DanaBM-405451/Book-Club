const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de Prisma
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          message: 'Ya existe un registro con esos datos',
          field: err.meta?.target,
        });

      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado',
        });

      case 'P2003':
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida a otro registro',
        });

      default:
        return res.status(500).json({
          success: false,
          message: 'Error de base de datos',
          code: err.code,
        });
    }
  }

  // Error personalizado con statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Error genérico
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};

module.exports = errorHandler;