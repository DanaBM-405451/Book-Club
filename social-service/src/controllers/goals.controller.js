// src/controllers/goal.controller.js

const goalsService = require('../services/goals.service');

/**
 * Crear meta de lectura (solo admin)
 * POST /groups/:groupId/goals
 * Body: { bookId, bookTitle?, bookAuthor?, bookCoverUrl?, targetPages?, startDate, endDate, frequency?, description? }
 */
const createReadingGoal = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    if (!req.body.bookId || !req.body.startDate || !req.body.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren: bookId, startDate y endDate'
      });
    }

    const goal = await goalsService.createGoal(parseInt(groupId), userId, req.body, token);

    return res.status(201).json({
      success: true,
      data: goal,
      message: 'Meta de lectura creada correctamente'
    });

  } catch (error) {
    console.error('Error creando meta de lectura:', error);
    const statusCode = error.message.includes('administrador') ? 403 : 
                       error.message.includes('no existe') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener metas de lectura del grupo
 * GET /groups/:groupId/goals?includeInactive=false
 */
const getGroupGoals = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;
    const includeInactive = req.query.includeInactive === 'true';

    const goals = await goalsService.getGroupGoals(parseInt(groupId), userId, includeInactive, token);

    return res.status(200).json({
      success: true,
      data: goals,
      count: goals.length,
      message: 'Metas de lectura obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo metas:', error);
    const statusCode = error.message.includes('miembros') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener meta activa del grupo
 * GET /groups/:groupId/goals/active
 */
const getActiveGoal = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    const goal = await goalsService.getActiveGoal(parseInt(groupId), userId, token);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'No hay ninguna meta activa en este grupo'
      });
    }

    return res.status(200).json({
      success: true,
      data: goal,
      message: 'Meta activa obtenida correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo meta activa:', error);
    const statusCode = error.message.includes('miembros') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Editar meta de lectura (solo admin)
 * PUT /groups/:groupId/goals/:goalId
 * Body: { bookTitle?, bookAuthor?, targetPages?, startDate?, endDate?, frequency?, description? }
 */
const updateReadingGoal = async (req, res) => {
  try {
    const { groupId, goalId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    const goal = await goalsService.updateGoal(
      parseInt(groupId), 
      parseInt(goalId), 
      userId, 
      req.body, 
      token
    );

    return res.status(200).json({
      success: true,
      data: goal,
      message: 'Meta de lectura actualizada correctamente'
    });

  } catch (error) {
    console.error('Error actualizando meta:', error);
    const statusCode = error.message.includes('no encontrada') ? 404 : 
                       error.message.includes('administrador') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Completar meta de lectura (solo admin)
 * POST /groups/:groupId/goals/:goalId/complete
 */
const completeGoal = async (req, res) => {
  try {
    const { groupId, goalId } = req.params;
    const userId = req.user.id;

    const goal = await goalsService.completeGoal(parseInt(groupId), parseInt(goalId), userId);

    return res.status(200).json({
      success: true,
      data: goal,
      message: 'Meta de lectura completada'
    });

  } catch (error) {
    console.error('Error completando meta:', error);
    const statusCode = error.message.includes('no encontrada') ? 404 : 
                       error.message.includes('administrador') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Eliminar meta de lectura (solo admin)
 * DELETE /groups/:groupId/goals/:goalId
 */
const deleteGoal = async (req, res) => {
  try {
    const { groupId, goalId } = req.params;
    const userId = req.user.id;

    const result = await goalsService.deleteGoal(parseInt(groupId), parseInt(goalId), userId);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error eliminando meta:', error);
    const statusCode = error.message.includes('no encontrada') ? 404 : 
                       error.message.includes('administrador') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createReadingGoal,
  getGroupGoals,
  getActiveGoal,
  updateReadingGoal,
  completeGoal,
  deleteGoal
};
//const prisma = require('../config/database');

/**
 * Helper: Verificar si el usuario es admin del grupo
 */
/*
const checkGroupAdmin = async (groupId, userId) => {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    }
  });
  return membership && membership.role === 'ADMIN';
};

/**
 * Helper: Verificar si el usuario es miembro del grupo
 */
/*
const checkGroupMembership = async (groupId, userId) => {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    }
  });
  return membership;
};

/**
 * Crear meta de lectura
 * POST /social/groups/:id/goals
 * Body: { bookId?, bookTitle, bookAuthor?, bookCoverUrl?, targetPages?, startDate, endDate, frequency }
 */
/*
const createReadingGoal = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;
    const { 
      bookId, 
      bookTitle, 
      bookAuthor, 
      bookCoverUrl, 
      targetPages, 
      startDate, 
      endDate, 
      frequency 
    } = req.body;

    // Validaciones
    if (!bookTitle || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren: bookTitle, startDate y endDate'
      });
    }

    // Verificar que es admin del grupo
    const isAdmin = await checkGroupAdmin(groupId, userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Solo el administrador del grupo puede crear metas de lectura'
      });
    }

    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }

    // Crear meta
    const goal = await prisma.readingGoal.create({
      data: {
        groupId,
        bookId: bookId || null,
        bookTitle,
        bookAuthor: bookAuthor || null,
        bookCoverUrl: bookCoverUrl || null,
        targetPages: targetPages || null,
        startDate: start,
        endDate: end,
        frequency: frequency || 'WEEKLY',
        status: 'ACTIVE',
        createdByUserId: userId
      }
    });

    return res.status(201).json({
      success: true,
      data: goal,
      message: 'Meta de lectura creada correctamente'
    });

  } catch (error) {
    console.error('Error creando meta de lectura:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear meta de lectura',
      error: error.message
    });
  }
};

/**
 * Obtener metas de lectura del grupo
 * GET /social/groups/:id/goals?status=ACTIVE
 */
/*
const getGroupGoals = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;
    const { status } = req.query;

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para ver las metas'
      });
    }

    // Filtros
    const where = { groupId };
    if (status) {
      where.status = status;
    }

    const goals = await prisma.readingGoal.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: goals,
      count: goals.length,
      message: 'Metas de lectura obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo metas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener metas de lectura',
      error: error.message
    });
  }
};

/**
 * Editar meta de lectura
 * PUT /social/groups/:id/goals/:goalId
 * Body: { bookTitle?, targetPages?, startDate?, endDate?, frequency?, status? }
 */
/*
const updateReadingGoal = async (req, res) => {
  try {
    const { id: groupId, goalId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Verificar que es admin del grupo
    const isAdmin = await checkGroupAdmin(groupId, userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Solo el administrador del grupo puede editar metas'
      });
    }

    // Verificar que la meta existe y pertenece al grupo
    const goal = await prisma.readingGoal.findFirst({
      where: {
        id: goalId,
        groupId
      }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Meta de lectura no encontrada'
      });
    }

    // Validar fechas si se están actualizando
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        });
      }
    }

    // Actualizar meta
    const updatedGoal = await prisma.readingGoal.update({
      where: { id: goalId },
      data: {
        bookTitle: updateData.bookTitle || goal.bookTitle,
        targetPages: updateData.targetPages !== undefined ? updateData.targetPages : goal.targetPages,
        startDate: updateData.startDate ? new Date(updateData.startDate) : goal.startDate,
        endDate: updateData.endDate ? new Date(updateData.endDate) : goal.endDate,
        frequency: updateData.frequency || goal.frequency,
        status: updateData.status || goal.status
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedGoal,
      message: 'Meta de lectura actualizada correctamente'
    });

  } catch (error) {
    console.error('Error actualizando meta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar meta de lectura',
      error: error.message
    });
  }
};

module.exports = {
  createReadingGoal,
  getGroupGoals,
  updateReadingGoal
};
*/