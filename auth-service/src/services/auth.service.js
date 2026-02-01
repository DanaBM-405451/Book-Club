
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const axios = require('axios'); 
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getRefreshTokenExpiration
} = require('../utils/jwt.utils.js');

class AuthService {
  /**
   * Registrar nuevo usuario
   */
  async register({ email, username, password, nombre, apellido, edad, genero, pais, ciudad }) {
    // Verificar si email ya existe
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingEmail) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    
    // Verificar si username ya existe
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUsername) {
      throw new Error('USERNAME_ALREADY_EXISTS');
    }
    
    // Hash de password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER',
        /*nombre,
        apellido,
        edad,
        genero,
        pais,
        ciudad*/
        
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
      
      await axios.post(`${userServiceUrl}/api/users/profile/create`, {
        userId: user.id, 
        username: user.username,
        nombre,
        apellido,
        edad,
        pais,
        ciudad
      });
      
      console.log(`✅ Perfil solicitado para usuario ${user.id}`);

    } catch (error) {
      // ⚠️ IMPORTANTE: Si falla la creación del perfil, ¿qué hacemos?
      // Opción A: Borrar el usuario de Auth (Rollback manual) para que intente de nuevo.
      console.error("❌ Error creando perfil en user-service:", error.message);
      
      // Rollback: Borramos el usuario de Auth para mantener consistencia
      await prisma.user.delete({ where: { id: user.id } });
      throw new Error('ERROR_CREATING_PROFILE_SERVICE_UNAVAILABLE');
    }
    
    return user;
  }
    

  /**
   * Login de usuario
   */
  async login({ emailOrUsername, password }) {
    // Buscar usuario por email o username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });
    
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }
    
    // Verificar si está activo
    if (!user.isActive) {
      throw new Error('ACCOUNT_INACTIVE');
    }
    
    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }
    
    // Generar tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });
    
    const refreshToken = generateRefreshToken({
      userId: user.id
    });
    
    // Guardar refresh token en BD
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiration()
      }
    });
    
    // Actualizar lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    // Verificar token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
    
    // Buscar token en BD
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });
    
    if (!tokenRecord) {
      throw new Error('REFRESH_TOKEN_NOT_FOUND');
    }
    
    // Verificar si está revocado
    if (tokenRecord.isRevoked) {
      throw new Error('REFRESH_TOKEN_REVOKED');
    }
    
    // Verificar si expiró
    if (new Date() > tokenRecord.expiresAt) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    
    // Verificar si usuario está activo
    if (!tokenRecord.user.isActive) {
      throw new Error('ACCOUNT_INACTIVE');
    }
    
    // Generar nuevo access token
    const newAccessToken = generateAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      username: tokenRecord.user.username,
      role: tokenRecord.user.role
    });
    
    return {
      accessToken: newAccessToken
    };
  }

  /**
   * Logout - Revocar refresh token
   */
  async logout(refreshToken) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });
    
    if (!tokenRecord) {
      throw new Error('REFRESH_TOKEN_NOT_FOUND');
    }
    
    // Marcar como revocado
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { isRevoked: true }
    });
    
    return { message: 'Logout successful' };
  }

  /**
   * Verificar si token es válido
   */
  async verifyAccessToken(token) {
    try {
      const decoded = verifyToken(token);
      
      // Verificar que el usuario aún existe y está activo
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
        throw new Error('USER_NOT_FOUND_OR_INACTIVE');
      }
      
      return {
        valid: true,
        user
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener información de usuario por ID
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    
    return user;
  }
}

module.exports = new AuthService();




/*const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

exports.registerUser = async ({ name, email, password, city, country }) => {
  // Verificar si el usuario existe
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('User with email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      name,
      lastName,
      email,
      nickname,
      password,
      ciudad,
      pais
    }
  });

 
  return {
    message: 'Usuario creado exitosamente',
    userId: user.id
  };
};

exports.loginUser = async ({ email, password }) => {
  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verificar password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generar JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

exports.verifyToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, name: true, email: true, role: true }
  });

  return user;
};

exports.getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, city: true, country: true, createdAt: true }
  });
};*/

