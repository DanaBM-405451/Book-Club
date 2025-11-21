// src/routes/challenges.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createChallenge,
  getGroupChallenges,
  getActiveChallenge,
  getChallengeById,
  joinChallenge,
  updateProgress,
  getChallengeProgress,
  getChallengeRanking,
  archiveChallenge,
  reactivateChallenge
} = require('../controllers/challenges.controller');

/**
 * @route POST /groups/:groupId/challenges
 * @desc Crear reto de lectura
 * @access Private (solo miembros)
 */
router.post('/:groupId/challenges', authMiddleware, createChallenge);

/**
 * @route GET /groups/:groupId/challenges
 * @desc Listar retos del grupo
 * @access Private (solo miembros)
 */
router.get('/:groupId/challenges', authMiddleware, getGroupChallenges);

/**
 * @route GET /groups/:groupId/challenges/active
 * @desc Obtener reto activo del grupo
 * @access Private (solo miembros)
 */
router.get('/:groupId/challenges/active', authMiddleware, getActiveChallenge);

/**
 * @route GET /groups/:groupId/challenges/:challengeId
 * @desc Obtener detalle de un reto
 * @access Private (solo miembros)
 */
router.get('/:groupId/challenges/:challengeId', authMiddleware, getChallengeById);

/**
 * @route POST /groups/:groupId/challenges/:challengeId/join
 * @desc Unirse a un reto
 * @access Private (solo miembros)
 */
router.post('/:groupId/challenges/:challengeId/join', authMiddleware, joinChallenge);

/**
 * @route POST /groups/:groupId/challenges/:challengeId/progress
 * @desc Actualizar progreso en el reto
 * @access Private (solo participantes)
 */
router.post('/:groupId/challenges/:challengeId/progress', authMiddleware, updateProgress);

/**
 * @route GET /groups/:groupId/challenges/:challengeId/progress
 * @desc Obtener progreso general del reto
 * @access Private (solo miembros)
 */
router.get('/:groupId/challenges/:challengeId/progress', authMiddleware, getChallengeProgress);

/**
 * @route GET /groups/:groupId/challenges/:challengeId/ranking
 * @desc Obtener ranking del reto
 * @access Private (solo miembros)
 */
router.get('/:groupId/challenges/:challengeId/ranking', authMiddleware, getChallengeRanking);

/**
 * @route POST /groups/:groupId/challenges/:challengeId/archive
 * @desc Archivar reto (solo admin)
 * @access Private
 */
router.post('/:groupId/challenges/:challengeId/archive', authMiddleware, archiveChallenge);

/**
 * @route POST /groups/:groupId/challenges/:challengeId/reactivate
 * @desc Reactivar reto archivado (solo admin)
 * @access Private
 */
router.post('/:groupId/challenges/:challengeId/reactivate', authMiddleware, reactivateChallenge);

module.exports = router;