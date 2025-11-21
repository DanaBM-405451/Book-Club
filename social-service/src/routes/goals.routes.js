// src/routes/goals.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createReadingGoal,
  getGroupGoals,
  getActiveGoal,
  updateReadingGoal,
  completeGoal,
  deleteGoal
} = require('../controllers/goals.controller');

/**
 * @route POST /groups/:groupId/goals
 * @desc Crear meta de lectura (solo admin)
 * @access Private
 */
router.post('/:groupId/goals', authMiddleware, createReadingGoal);

/**
 * @route GET /groups/:groupId/goals
 * @desc Obtener metas de lectura del grupo
 * @access Private (solo miembros)
 */
router.get('/:groupId/goals', authMiddleware, getGroupGoals);

/**
 * @route GET /groups/:groupId/goals/active
 * @desc Obtener meta activa del grupo
 * @access Private (solo miembros)
 */
router.get('/:groupId/goals/active', authMiddleware, getActiveGoal);

/**
 * @route PUT /groups/:groupId/goals/:goalId
 * @desc Editar meta de lectura (solo admin)
 * @access Private
 */
router.put('/:groupId/goals/:goalId', authMiddleware, updateReadingGoal);

/**
 * @route POST /groups/:groupId/goals/:goalId/complete
 * @desc Completar meta de lectura (solo admin)
 * @access Private
 */
router.post('/:groupId/goals/:goalId/complete', authMiddleware, completeGoal);

/**
 * @route DELETE /groups/:groupId/goals/:goalId
 * @desc Eliminar meta de lectura (solo admin)
 * @access Private
 */
router.delete('/:groupId/goals/:goalId', authMiddleware, deleteGoal);

module.exports = router;