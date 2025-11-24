// src/routes/goals.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const goalsController = require('../controllers/goals.controller');

/**
 * @route GET /goals
 * @desc Obtener todas las metas
 * @access Private
 */
router.get('/', authMiddleware, goalsController.getGoals);

/**
 * @route POST /goals
 * @desc Crear una nueva meta
 * @access Private
 */
router.post('/', authMiddleware, goalsController.createGoal);

/**
 * @route GET /goals/active
 * @desc Obtener meta activa
 * @access Private
 */
router.get('/active', authMiddleware, goalsController.getActiveGoal);

/**
 * @route PUT /goals/:goalId
 * @desc Actualizar una meta
 * @access Private
 */
router.put('/:goalId', authMiddleware, goalsController.updateGoal);

/**
 * @route DELETE /goals/:goalId
 * @desc Eliminar una meta
 * @access Private
 */
router.delete('/:goalId', authMiddleware, goalsController.deleteGoal);

/**
 * @route POST /goals/:goalId/complete
 * @desc Marcar meta como completada
 * @access Private
 */
router.post('/:goalId/complete', authMiddleware, goalsController.completeGoal);

module.exports = router;