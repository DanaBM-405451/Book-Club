const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas públicas (no requieren autenticación)
const publicRoutes = ['/register', '/login'];

// Proxy para rutas públicas
router.use(publicRoutes, createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(503).json({ error: 'Auth service unavailable' });
  }
}));

// Middleware de autenticación para rutas protegidas
router.use('*', authMiddleware);

// Proxy para rutas protegidas
router.use('*', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(503).json({ error: 'Auth service unavailable' });
  }
}));

module.exports = router;