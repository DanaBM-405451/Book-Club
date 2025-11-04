
const authService = require('../services/auth.service.js');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
class AuthController {
  /**
   * POST /api/auth/register
   */
  
  /*async register(req, res, next) {
    try {
      const { email, username, password } = req.body;
      
      const user = await authService.register({ email, username, password });

      if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Faltan campos obligatorios." });
    }
      
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: { user }
        
      });
 const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "USER"
    });

    return res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente.",
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  
    } catch (error) {
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
      
      if (error.message === 'USERNAME_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          message: 'El username ya está en uso'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      
      next(error);
    }
  }*/
 async register(req, res, next) {
    try {
      const { email, username, password, nombre, apellido, edad, pais, ciudad } = req.body;

      const user = await authService.register({
        email,
        username,
        password,
        nombre,
        apellido,
        edad,
        pais,
        ciudad
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: { user }
      });

    } catch (error) {
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
      if (error.message === 'USERNAME_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          message: 'El username ya está en uso'
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { emailOrUsername, password } = req.body;
      
      const result = await authService.login({ emailOrUsername, password });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      if (error.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          success: false,
          message: 'Email/username o contraseña incorrectos'
        });
      }
      
      if (error.message === 'ACCOUNT_INACTIVE') {
        return res.status(403).json({
          success: false,
          message: 'Cuenta inactiva. Contacta al administrador'
        });
      }
      
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.refreshAccessToken(refreshToken);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      if (
        error.message === 'INVALID_REFRESH_TOKEN' ||
        error.message === 'REFRESH_TOKEN_NOT_FOUND' ||
        error.message === 'REFRESH_TOKEN_REVOKED' ||
        error.message === 'REFRESH_TOKEN_EXPIRED'
      ) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido o expirado'
        });
      }
      
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      await authService.logout(refreshToken);
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      if (error.message === 'REFRESH_TOKEN_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Refresh token no encontrado'
        });
      }
      
      next(error);
    }
  }

  /**
   * POST /api/auth/verify
   * Verificar si un access token es válido
   */
  async verifyToken(req, res, next) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }
      
      const result = await authService.verifyAccessToken(token);
      
      if (!result.valid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          error: result.error
        });
      }
      
      res.json({
        success: true,
        message: 'Token is valid',
        data: { user: result.user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Obtener información del usuario autenticado
   */
  async getMe(req, res, next) {
    try {
      // req.user viene del middleware de autenticación
      const user = await authService.getUserById(req.user.userId);
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      next(error);
    }
  }
}

module.exports = new AuthController();

/*const authService = require('../services/auth.service');

exports.register = async (req, res) => {
  try {
    const { name, email, password, city, country } = req.body;
    
    // Validación básica
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const result = await authService.registerUser({ name, email, password, city, country });
    res.status(201).json(result);
  } catch (error) {
    console.error('Register error:', error);
    
    if (error.message.includes('email already exists')) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const result = await authService.loginUser({ email, password });
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message.includes('Invalid credentials')) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.verify = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const user = await authService.verifyToken(token);
    res.json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Token inválido' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await authService.getUserById(parseInt(id));
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};*/