// src/controllers/email.controller.js

/**
 * PROPÓSITO:
 * - Manejar requests HTTP del API de emails
 * - Validar inputs
 * - Llamar a servicios de email
 */

const emailService = require('../services/email.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * @route POST /api/email/send
 * @desc Enviar email genérico
 * @access Internal (sin autenticación por ahora)
 */
const sendGenericEmail = async (req, res) => {
  try {
    const { to, subject, html, text, type } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, html',
      });
    }

    const result = await emailService.sendEmail({ to, subject, html, text, type });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
    });
  }
};

/**
 * @route POST /api/email/reset-password
 * @desc Enviar email de recuperación de contraseña
 * @access Internal
 */
const sendPasswordReset = async (req, res) => {
  try {
    const { email, resetToken, userId } = req.body;

    if (!email || !resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, resetToken',
      });
    }

    const result = await emailService.sendPasswordResetEmail({
      email,
      resetToken,
      userId,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
      error: error.message,
    });
  }
};

/**
 * @route POST /api/email/newsletter/subscribe
 * @desc Suscribirse al newsletter
 * @access Public
 */
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Verificar si ya existe
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing && existing.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Email already subscribed',
      });
    }

    // Crear o reactivar suscripción
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {
        isActive: true,
        subscribedAt: new Date(),
        unsubscribedAt: null,
      },
      create: {
        email,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: subscriber,
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe',
      error: error.message,
    });
  }
};

/**
 * @route POST /api/email/newsletter/send
 * @desc Enviar newsletter a todos los suscriptores
 * @access Admin (agregar auth después)
 */
const sendNewsletterBatch = async (req, res) => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject, content',
      });
    }

    // Obtener suscriptores activos
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
    });

    if (subscribers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active subscribers found',
      });
    }

    // Enviar emails (en producción usar queue como Bull)
    const results = await Promise.allSettled(
      subscribers.map((subscriber) =>
        emailService.sendNewsletterEmail({
          email: subscriber.email,
          subject,
          content,
        })
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    res.status(200).json({
      success: true,
      message: 'Newsletter sent',
      data: {
        total: subscribers.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send newsletter',
      error: error.message,
    });
  }
};

module.exports = {
  sendGenericEmail,
  sendPasswordReset,
  subscribeNewsletter,
  sendNewsletterBatch,
};