// src/routes/email.routes.js

const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');

/**
 * @route POST /api/email/send
 * @desc Enviar email genérico
 */
router.post('/send', emailController.sendGenericEmail);

/**
 * @route POST /api/email/reset-password
 * @desc Enviar email de recuperación de contraseña
 */
router.post('/reset-password', emailController.sendPasswordReset);

/**
 * @route POST /api/email/newsletter/subscribe
 * @desc Suscribirse al newsletter
 */
router.post('/newsletter/subscribe', emailController.subscribeNewsletter);

/**
 * @route POST /api/email/newsletter/send
 * @desc Enviar newsletter (futuro)
 */
router.post('/newsletter/send', emailController.sendNewsletterBatch);

module.exports = router;