// src/services/email.service.js

/**
 * PROPÓSITO:
 * - Lógica de negocio para envío de emails
 * - Compilar templates HTML con Handlebars
 * - Registrar logs de envío
 */

const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const { createTransporter } = require('../config/email.config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Compilar template HTML con datos dinámicos
 */
const compileTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateContent);
    return compiledTemplate(data);
  } catch (error) {
    console.error(`Error compiling template ${templateName}:`, error);
    throw new Error('Failed to compile email template');
  }
};

/**
 * Enviar email genérico
 */
const sendEmail = async ({ to, subject, html, text, type = 'NOTIFICATION' }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text: text || '', // Fallback a texto plano
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Registrar en log
    await prisma.emailLog.create({
      data: {
        recipientEmail: to,
        emailType: type,
        subject,
        template: null,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    console.log(`✅ Email sent to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Registrar error
    await prisma.emailLog.create({
      data: {
        recipientEmail: to,
        emailType: type,
        subject,
        status: 'FAILED',
        errorMessage: error.message,
      },
    });

    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
};

/**
 * Enviar email de recuperación de contraseña
 */
const sendPasswordResetEmail = async ({ email, resetToken, userId }) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = await compileTemplate('reset-password', {
    resetLink,
    expirationMinutes: process.env.RESET_TOKEN_EXPIRATION || 15,
  });

  return await sendEmail({
    to: email,
    subject: 'Recuperación de contraseña - BookClub',
    html,
    type: 'PASSWORD_RESET',
  });
};

/**
 * Enviar newsletter
 */
const sendNewsletterEmail = async ({ email, subject, content }) => {
  const html = await compileTemplate('newsletter', {
    content,
    unsubscribeLink: `${process.env.FRONTEND_URL}/unsubscribe?email=${email}`,
  });

  return await sendEmail({
    to: email,
    subject,
    html,
    type: 'NEWSLETTER',
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendNewsletterEmail,
};