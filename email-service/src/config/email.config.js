// src/config/email.config.js

/**
 * PROPÓSITO:
 * - Configurar Nodemailer con credenciales SMTP
 * - Centralizar configuración de email
 * - Manejar diferentes proveedores (Gmail, SendGrid, etc.)
 */

const nodemailer = require('nodemailer');

/**
 * Crear transporter de Nodemailer
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Verificar conexión SMTP
 */
const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    return false;
  }
};

module.exports = {
  createTransporter,
  verifyConnection,
};