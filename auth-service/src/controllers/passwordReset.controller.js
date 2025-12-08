// auth-service/src/controllers/passwordReset.controller.js

/**
 * PROPÓSITO:
 * - Manejar requests HTTP de recuperación de contraseña
 * - Validar inputs
 * - Responder con mensajes apropiados
 */

const passwordResetService = require('../services/passwordReset.service');

/**
 * @route POST /api/auth/forgot-password
 * @desc Solicitar recuperación de contraseña
 * @access Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validación
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido',
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido',
      });
    }

    const result = await passwordResetService.requestPasswordReset(email);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
    });
  }
};

/**
 * @route GET /api/auth/validate-reset-token/:token
 * @desc Validar token de recuperación
 * @access Public
 */
const validateToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token es requerido',
      });
    }

    const validation = await passwordResetService.validateResetToken(token);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        email: validation.user.email,
        username: validation.user.username,
      },
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar el token',
    });
  }
};

/**
 * @route POST /api/auth/reset-password
 * @desc Restablecer contraseña con token
 * @access Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validaciones
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos',
      });
    }

    // Validar longitud de contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const result = await passwordResetService.resetPassword(token, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña',
    });
  }
};

module.exports = {
  forgotPassword,
  validateToken,
  resetPassword,
};