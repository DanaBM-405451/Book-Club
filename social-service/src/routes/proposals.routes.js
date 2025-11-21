// src/routes/proposals.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createProposal,
  getGroupProposals,
  getProposalById,
  voteProposal,
  closeProposal,
  cancelProposal,
  getWinningProposal
} = require('../controllers/proposals.controller');

/**
 * @route POST /groups/:groupId/proposals
 * @desc Proponer un libro para el grupo
 * @access Private (solo miembros)
 */
router.post('/:groupId/proposals', authMiddleware, createProposal);

/**
 * @route GET /groups/:groupId/proposals
 * @desc Obtener propuestas de libros del grupo
 * @access Private (solo miembros)
 */
router.get('/:groupId/proposals', authMiddleware, getGroupProposals);

/**
 * @route GET /groups/:groupId/proposals/winner
 * @desc Obtener propuesta ganadora del grupo
 * @access Private (solo miembros)
 */
router.get('/:groupId/proposals/winner', authMiddleware, getWinningProposal);

/**
 * @route GET /groups/:groupId/proposals/:proposalId
 * @desc Obtener detalle de una propuesta
 * @access Private (solo miembros)
 */
router.get('/:groupId/proposals/:proposalId', authMiddleware, getProposalById);

/**
 * @route POST /groups/:groupId/proposals/:proposalId/vote
 * @desc Votar por una propuesta de libro
 * @access Private (solo miembros)
 */
router.post('/:groupId/proposals/:proposalId/vote', authMiddleware, voteProposal);

/**
 * @route POST /groups/:groupId/proposals/:proposalId/close
 * @desc Cerrar votación (solo admin)
 * @access Private
 */
router.post('/:groupId/proposals/:proposalId/close', authMiddleware, closeProposal);

/**
 * @route DELETE /groups/:groupId/proposals/:proposalId
 * @desc Cancelar propuesta (admin o proponente)
 * @access Private
 */
router.delete('/:groupId/proposals/:proposalId', authMiddleware, cancelProposal);

module.exports = router;