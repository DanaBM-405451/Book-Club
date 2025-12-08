// auth-service/src/services/passwordReset.service.js

/**
 * PROPÓSITO:
 * - Generar tokens seguros para recuperación de contraseña
 * - Validar tokens
 * - Comunicarse con email-service
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const axios = require('axios');

const prisma = new PrismaClient();

// URL del email-service (ajustar según tu docker-compose)
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:5006';

/**
 * Generar token aleatorio seguro
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Solicitar recuperación de contraseña
 * @param {string} email - Email del usuario
 */
const requestPasswordReset = async (email) => {
  try {
    // 1. Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // ⚠️ IMPORTANTE: No revelar si el email existe o no (seguridad)
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return {
        success: true,
        message: 'Si el correo existe, recibirás un email con instrucciones',
      };
    }

    // 2. Invalidar tokens anteriores del usuario
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // 3. Generar nuevo token
    const resetToken = generateSecureToken();
    const expirationMinutes = parseInt(process.env.RESET_TOKEN_EXPIRATION) || 15;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // 4. Guardar token en base de datos
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // 5. Llamar al email-service para enviar el correo
    try {
      await axios.post(`${EMAIL_SERVICE_URL}/api/email/reset-password`, {
        email: user.email,
        resetToken,
        userId: user.id,
      });

      console.log(`✅ Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError.message);
      // No fallar si el email no se envía, pero registrar el error
    }

    return {
      success: true,
      message: 'Si el correo existe, recibirás un email con instrucciones',
    };
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    throw error;
  }
};

/**
 * Validar token de recuperación
 * @param {string} token - Token a validar
 */
const validateResetToken = async (token) => {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    // Validaciones
    if (!resetToken) {
      return { valid: false, message: 'Token inválido' };
    }

    if (resetToken.isUsed) {
      return { valid: false, message: 'Token ya utilizado' };
    }

    if (new Date() > resetToken.expiresAt) {
      return { valid: false, message: 'Token expirado' };
    }

    return {
      valid: true,
      userId: resetToken.userId,
      user: resetToken.user,
    };
  } catch (error) {
    console.error('Error validating token:', error);
    throw error;
  }
};

/**
 * Restablecer contraseña
 * @param {string} token - Token de recuperación
 * @param {string} newPassword - Nueva contraseña
 */
const resetPassword = async (token, newPassword) => {
  try {
    // 1. Validar token
    const validation = await validateResetToken(token);

    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
      };
    }

    // 2. Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Actualizar contraseña del usuario
    await prisma.user.update({
      where: { id: validation.userId },
      data: {
        password: hashedPassword,
      },
    });

    // 4. Marcar token como usado
    await prisma.passwordResetToken.update({
      where: { token },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    console.log(`✅ Password reset successful for user ${validation.userId}`);

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

module.exports = {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
};