const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validacion',
      errors: err.details
    });
  }
  
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists'
    });
  }
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Error severo interno'
  });
};

module.exports = errorHandler;