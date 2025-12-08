// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');
const { authenticate } = require('../middlewares/auth.middleware.js');
const passwordResetController = require('../controllers/passwordReset.controller.js');
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation
} = require('../utils/validators.js');

router.post('/register',authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', refreshTokenValidation, authController.refreshToken);
router.post('/logout', refreshTokenValidation, authController.logout);
router.post('/verify', authController.verifyToken);
router.get('/me', authenticate, authController.getMe);

// ========== ✅ NUEVAS RUTAS DE PASSWORD RESET ==========
router.post('/forgot-password', passwordResetController.forgotPassword);
router.get('/validate-reset-token/:token', passwordResetController.validateToken);
router.post('/reset-password', passwordResetController.resetPassword);

module.exports = router;