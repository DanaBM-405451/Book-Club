// src/routes/proposals.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const proposalsController = require('../controllers/proposals.controller');

/**
 * @route GET /proposals
 * @desc Obtener todas las propuestas
 * @access Private
 */
router.get('/', authMiddleware, proposalsController.getProposals);

/**
 * @route POST /proposals
 * @desc Crear una nueva propuesta
 * @access Private
 */
router.post('/', authMiddleware, proposalsController.createProposal);

/**
 * @route POST /proposals/:proposalId/vote
 * @desc Votar por una propuesta
 * @access Private
 */
router.post('/:proposalId/vote', authMiddleware, proposalsController.voteProposal);

/**
 * @route POST /proposals/:proposalId/close
 * @desc Cerrar votación
 * @access Private
 */
router.post('/:proposalId/close', authMiddleware, proposalsController.closeProposal);

/**
 * @route DELETE /proposals/:proposalId
 * @desc Cancelar una propuesta
 * @access Private
 */
router.delete('/:proposalId', authMiddleware, proposalsController.cancelProposal);

/**
 * @route GET /proposals/winner
 * @desc Obtener libro ganador
 * @access Private
 */
router.get('/winner', authMiddleware, proposalsController.getWinner);

module.exports = router;