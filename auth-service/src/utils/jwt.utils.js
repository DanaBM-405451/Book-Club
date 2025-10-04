
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'; //Ahora que estamos en produccion
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generar Access Token 
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Generar Refresh Token (larga duración)
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  });
};

/**
 * Verificar token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Decodificar token sin verificar (útil para debug y testear)
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Calcular fecha de expiración del refresh token
 */
const getRefreshTokenExpiration = () => {
  const expiresIn = JWT_REFRESH_EXPIRES_IN;
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  
  if (!match) {
    throw new Error('Invalid JWT_REFRESH_EXPIRES_IN format');
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const now = new Date();
  
  switch (unit) {
    case 'd': // días
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    case 'h': // horas
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'm': // minutos
      return new Date(now.getTime() + value * 60 * 1000);
    case 's': // segundos
      return new Date(now.getTime() + value * 1000);
    default:
      throw new Error('Invalid time unit');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  getRefreshTokenExpiration
};