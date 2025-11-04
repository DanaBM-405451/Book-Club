const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// ✅ NUEVO: Endpoint para library-service (sin autenticación por ahora)
// En producción, deberías agregar un API Key o token de servicio
router.post('/stats/update', gamificationController.updateStats);



// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/gamification/stats
 * @desc    Obtener estadísticas del usuario (XP, nivel, racha)
 * @access  Private
 */
router.get('/stats', gamificationController.getStats);

/**
 * @route   POST /api/gamification/pages
 * @desc    Agregar páginas leídas (gana XP)
 * @access  Private
 * @body    { pagesRead: number, bookId?: string }
 */
router.post('/pages', gamificationController.addPages);

/**
 * @route   POST /api/gamification/book/started
 * @desc    Marcar libro como iniciado
 * @access  Private
 */
router.post('/book/started', gamificationController.bookStarted);

/**
 * @route   POST /api/gamification/book/finished
 * @desc    Marcar libro como terminado
 * @access  Private
 * @body    { totalPages: number }
 */
router.post('/book/finished', gamificationController.bookFinished);

/**
 * @route   GET /api/gamification/achievements
 * @desc    Obtener todos los logros con estado (desbloqueados/bloqueados)
 * @access  Private
 */
router.get('/achievements', gamificationController.getAllAchievements);

/**
 * @route   GET /api/gamification/achievements/unlocked
 * @desc    Obtener solo logros desbloqueados del usuario
 * @access  Private
 */
router.get('/achievements/unlocked', gamificationController.getUserAchievements);

/**
 * @route   GET /api/gamification/activity
 * @desc    Obtener actividad de lectura reciente
 * @access  Private
 * @query   ?days=30
 */
router.get('/activity', gamificationController.getRecentActivity);

/**
 * @route   GET /api/gamification/leaderboard
 * @desc    Obtener ranking de usuarios
 * @access  Private
 * @query   ?limit=10&type=xp
 */
router.get('/leaderboard', gamificationController.getLeaderboard);

module.exports = router;

/*
// Rutas que requieren autenticación
router.use(authenticate);

router.get('/stats', gamificationController.getStats);
router.post('/pages', gamificationController.addPages);
router.post('/book/started', gamificationController.bookStarted);
router.post('/book/finished', gamificationController.bookFinished);
router.get('/achievements', gamificationController.getAllAchievements);
router.get('/achievements/unlocked', gamificationController.getUserAchievements);
router.get('/activity', gamificationController.getRecentActivity);
router.get('/leaderboard', gamificationController.getLeaderboard);
*/