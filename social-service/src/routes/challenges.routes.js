// src/routes/challenges.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const challengesController = require('../controllers/challenges.controller');

/**
 * @route GET /challenges
 * @desc Obtener todos los retos
 * @access Private
 */
router.get('/', authMiddleware, challengesController.getChallenges);

/**
 * @route POST /challenges
 * @desc Crear un nuevo reto
 * @access Private
 */
router.post('/', authMiddleware, challengesController.createChallenge);

/**
 * @route GET /challenges/active
 * @desc Obtener reto activo
 * @access Private
 */
router.get('/active', authMiddleware, challengesController.getActiveChallenge);

/**
 * @route POST /challenges/:challengeId/join
 * @desc Unirse a un reto
 * @access Private
 */
router.post('/:challengeId/join', authMiddleware, challengesController.joinChallenge);

/**
 * @route POST /challenges/:challengeId/progress
 * @desc Actualizar progreso
 * @access Private
 */
router.post('/:challengeId/progress', authMiddleware, challengesController.updateChallengeProgress);

/**
 * @route GET /challenges/:challengeId/ranking
 * @desc Obtener ranking del reto
 * @access Private
 */
router.get('/:challengeId/ranking', authMiddleware, challengesController.getChallengeRanking);

/**
 * @route POST /challenges/:challengeId/archive
 * @desc Archivar un reto
 * @access Private
 */
router.post('/:challengeId/archive', authMiddleware, challengesController.archiveChallenge);

/**
 * @route POST /challenges/:challengeId/reactivate
 * @desc Reactivar un reto
 * @access Private
 */
router.post('/:challengeId/reactivate', authMiddleware, challengesController.reactivateChallenge);

module.exports = router;