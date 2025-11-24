// src/controllers/challenges.controller.js

const challengesService = require('../services/challenges.service');

/**
 * Obtener retos del grupo
 * GET /groups/:groupId/challenges?includeArchived=false
 */
const getChallenges = async (req, res) => {
  try {
    const { groupId } = req.params;
    const includeArchived = req.query.includeArchived === 'true';

    const challenges = await challengesService.getChallenges(
      parseInt(groupId),
      includeArchived
    );

    return res.status(200).json({
      success: true,
      data: challenges,
      message: 'Retos obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo retos:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Crear un reto de lectura
 * POST /groups/:groupId/challenges
 * Body: { bookId, bookTitle, bookAuthor?, totalPages, startDate, endDate, description? }
 */
const createChallenge = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    if (!req.body.bookTitle || !req.body.totalPages || !req.body.startDate || !req.body.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    const challenge = await challengesService.createChallenge(
      parseInt(groupId),
      userId,
      req.body,
      token
    );

    return res.status(201).json({
      success: true,
      data: challenge,
      message: 'Reto creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando reto:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener reto activo
 * GET /groups/:groupId/challenges/active
 */
const getActiveChallenge = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const challenge = await challengesService.getActiveChallenge(
      parseInt(groupId),
      userId
    );

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'No hay reto activo'
      });
    }

    return res.status(200).json({
      success: true,
      data: challenge,
      message: 'Reto activo obtenido'
    });

  } catch (error) {
    console.error('Error obteniendo reto activo:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Unirse a un reto
 * POST /groups/:groupId/challenges/:challengeId/join
 */
const joinChallenge = async (req, res) => {
  try {
    const { groupId, challengeId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    const participation = await challengesService.joinChallenge(
      parseInt(groupId),
      parseInt(challengeId),
      userId,
      token
    );

    return res.status(200).json({
      success: true,
      data: participation,
      message: 'Te has unido al reto exitosamente'
    });

  } catch (error) {
    console.error('Error uniéndose al reto:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Actualizar progreso en un reto
 * POST /groups/:groupId/challenges/:challengeId/progress
 * Body: { currentPage: number }
 */
const updateChallengeProgress = async (req, res) => {
  try {
    const { groupId, challengeId } = req.params;
    const userId = req.user.id;
    const { currentPage } = req.body;
    const token = req.headers.authorization;

    if (currentPage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'La página actual es requerida'
      });
    }

    const progress = await challengesService.updateProgress(
      parseInt(groupId),
      parseInt(challengeId),
      userId,
      parseInt(currentPage),
      token
    );

    return res.status(200).json({
      success: true,
      data: progress,
      message: 'Progreso actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando progreso:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener ranking del reto
 * GET /groups/:groupId/challenges/:challengeId/ranking
 */
const getChallengeRanking = async (req, res) => {
  try {
    const { groupId, challengeId } = req.params;
    const token = req.headers.authorization;

    const ranking = await challengesService.getRanking(
      parseInt(groupId),
      parseInt(challengeId),
      token
    );

    return res.status(200).json({
      success: true,
      data: { ranking },
      message: 'Ranking obtenido correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo ranking:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Archivar un reto (solo admin)
 * POST /groups/:groupId/challenges/:challengeId/archive
 */
const archiveChallenge = async (req, res) => {
  try {
    const { groupId, challengeId } = req.params;
    const userId = req.user.id;

    const challenge = await challengesService.archiveChallenge(
      parseInt(groupId),
      parseInt(challengeId),
      userId
    );

    return res.status(200).json({
      success: true,
      data: challenge,
      message: 'Reto archivado correctamente'
    });

  } catch (error) {
    console.error('Error archivando reto:', error);
    const statusCode = error.message.includes('administrador') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Reactivar un reto archivado (solo admin)
 * POST /groups/:groupId/challenges/:challengeId/reactivate
 * Body: { newEndDate: string }
 */
const reactivateChallenge = async (req, res) => {
  try {
    const { groupId, challengeId } = req.params;
    const userId = req.user.id;
    const { newEndDate } = req.body;

    if (!newEndDate) {
      return res.status(400).json({
        success: false,
        message: 'La nueva fecha de fin es requerida'
      });
    }

    const challenge = await challengesService.reactivateChallenge(
      parseInt(groupId),
      parseInt(challengeId),
      userId,
      newEndDate
    );

    return res.status(200).json({
      success: true,
      data: challenge,
      message: 'Reto reactivado correctamente'
    });

  } catch (error) {
    console.error('Error reactivando reto:', error);
    const statusCode = error.message.includes('administrador') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getChallenges,
  createChallenge,
  getActiveChallenge,
  joinChallenge,
  updateChallengeProgress,
  getChallengeRanking,
  archiveChallenge,
  reactivateChallenge
};
/*
const prisma = require('../config/database');
const { awardPoints } = require('../utils/apiClient');

/**
 * Helper: Verificar membresía del grupo
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
 * Crear o subir libro para el reto del grupo
 * POST /social/groups/:id/challenge/book
 * Body: { bookId?, googleBookId?, title, author, coverUrl?, totalPages, startDate, endDate, basePoints?, bonusPoints? }
 */
/*
const createChallenge = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;
    const { 
      bookId, 
      googleBookId, 
      title, 
      author, 
      coverUrl, 
      totalPages, 
      startDate, 
      endDate,
      basePoints,
      bonusPoints
    } = req.body;

    // Validaciones
    if (!title || !author || !totalPages || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren: title, author, totalPages, startDate, endDate'
      });
    }

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para crear retos'
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

    // Verificar si ya existe un reto ACTIVE
    const activeChallenge = await prisma.groupChallenge.findFirst({
      where: {
        groupId,
        status: 'ACTIVE'
      }
    });

    if (activeChallenge) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un reto activo. Completa o archiva el reto actual primero.'
      });
    }

    // Crear reto
    const challenge = await prisma.groupChallenge.create({
      data: {
        groupId,
        bookId: bookId || null,
        googleBookId: googleBookId || null,
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl || null,
        totalPages: parseInt(totalPages),
        startDate: start,
        endDate: end,
        status: 'ACTIVE',
        basePoints: basePoints || 100,
        bonusPoints: bonusPoints || 50,
        createdByUserId: userId
      }
    });

    // Crear progreso automático para todos los miembros del grupo
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true }
    });

    const progressRecords = members.map(member => ({
      challengeId: challenge.id,
      userId: member.userId,
      currentPage: 0,
      progressPercent: 0,
      pointsEarned: 0
    }));

    await prisma.groupChallengeProgress.createMany({
      data: progressRecords
    });

    return res.status(201).json({
      success: true,
      data: challenge,
      message: 'Reto de lectura creado correctamente'
    });

  } catch (error) {
    console.error('Error creando reto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear reto de lectura',
      error: error.message
    });
  }
};

/**
 * Obtener libro/reto seleccionado para el grupo
 * GET /social/groups/:id/challenge/book
 */
/*
const getActiveChallenge = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para ver el reto'
      });
    }

    // Obtener reto activo
    const challenge = await prisma.groupChallenge.findFirst({
      where: {
        groupId,
        status: 'ACTIVE'
      },
      include: {
        progress: {
          select: {
            userId: true,
            currentPage: true,
            progressPercent: true,
            isCompleted: true
          }
        }
      }
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'No hay ningún reto activo en este grupo'
      });
    }

    return res.status(200).json({
      success: true,
      data: challenge,
      message: 'Reto activo obtenido correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo reto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener reto activo',
      error: error.message
    });
  }
};

/**
 * Obtener progreso del reto (todos los miembros)
 * GET /social/groups/:id/challenge/progress
 */
/*
const getChallengeProgress = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para ver el progreso'
      });
    }

    // Obtener reto activo
    const challenge = await prisma.groupChallenge.findFirst({
      where: {
        groupId,
        status: 'ACTIVE'
      }
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'No hay ningún reto activo'
      });
    }

    // Obtener progreso de todos los participantes
    const progress = await prisma.groupChallengeProgress.findMany({
      where: {
        challengeId: challenge.id
      },
      orderBy: {
        progressPercent: 'desc' // Ordenar por progreso
      }
    });

    // TODO: Enriquecer con datos de usuario desde user-service

    return res.status(200).json({
      success: true,
      data: progress,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        totalPages: challenge.totalPages,
        endDate: challenge.endDate
      },
      message: 'Progreso del reto obtenido correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener progreso del reto',
      error: error.message
    });
  }
};

/**
 * Actualizar progreso del usuario en el reto
 * POST /social/groups/:id/challenge/progress
 * Body: { currentPage }
 */
/*
const updateChallengeProgress = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;
    const { currentPage } = req.body;

    // Validaciones
    if (currentPage === undefined || currentPage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere currentPage (número >= 0)'
      });
    }

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo'
      });
    }

    // Obtener reto activo
    const challenge = await prisma.groupChallenge.findFirst({
      where: {
        groupId,
        status: 'ACTIVE'
      }
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'No hay ningún reto activo'
      });
    }

    // Calcular progreso
    const totalPages = challenge.totalPages;
    const pageNumber = Math.min(parseInt(currentPage), totalPages); // No puede exceder el total
    const progressPercent = ((pageNumber / totalPages) * 100).toFixed(2);
    const isCompleted = pageNumber >= totalPages;

    // Obtener progreso actual
    const existingProgress = await prisma.groupChallengeProgress.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challenge.id,
          userId
        }
      }
    });

    if (!existingProgress) {
      return res.status(404).json({
        success: false,
        message: 'No estás participando en este reto'
      });
    }

    // Verificar si recién completó el reto
    const justCompleted = !existingProgress.isCompleted && isCompleted;
    let pointsAwarded = 0;

    if (justCompleted) {
      // Verificar si lo completó a tiempo
      const now = new Date();
      const completedOnTime = now <= challenge.endDate;
      
      pointsAwarded = challenge.basePoints + (completedOnTime ? challenge.bonusPoints : 0);
      
      // Otorgar puntos a través de gamification-service
      const token = req.headers.authorization;
      await awardPoints(
        userId,
        pointsAwarded,
        `Completó reto de lectura: ${challenge.title}${completedOnTime ? ' (a tiempo)' : ''}`,
        token
      );
    }

    // Actualizar progreso
    const updatedProgress = await prisma.groupChallengeProgress.update({
      where: {
        id: existingProgress.id
      },
      data: {
        currentPage: pageNumber,
        progressPercent: parseFloat(progressPercent),
        isCompleted,
        completedAt: isCompleted && !existingProgress.isCompleted ? new Date() : existingProgress.completedAt,
        pointsEarned: justCompleted ? pointsAwarded : existingProgress.pointsEarned
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedProgress,
      pointsAwarded: justCompleted ? pointsAwarded : 0,
      message: justCompleted 
        ? `¡Felicitaciones! Completaste el reto y ganaste ${pointsAwarded} puntos` 
        : 'Progreso actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando progreso:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar progreso',
      error: error.message
    });
  }
};

/**
 * Obtener ranking final del reto
 * GET /social/groups/:id/challenge/ranking
 */
/*
const getChallengeRanking = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo'
      });
    }

    // Obtener el último reto (activo o completado)
    const challenge = await prisma.groupChallenge.findFirst({
      where: {
        groupId,
        status: { in: ['ACTIVE', 'COMPLETED'] }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'No hay retos disponibles'
      });
    }

    // Obtener ranking ordenado por puntos y progreso
    const ranking = await prisma.groupChallengeProgress.findMany({
      where: {
        challengeId: challenge.id
      },
      orderBy: [
        { pointsEarned: 'desc' },
        { progressPercent: 'desc' },
        { completedAt: 'asc' } // Los que completaron primero
      ]
    });

    return res.status(200).json({
      success: true,
      data: ranking,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        status: challenge.status
      },
      message: 'Ranking obtenido correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo ranking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener ranking',
      error: error.message
    });
  }
};

/**
 * Archivar reto (solo para admins o automático cuando termina)
 * PUT /social/groups/:id/challenge/archive
 */
/*
const archiveChallenge = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    // Verificar que es admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo el administrador puede archivar retos'
      });
    }

    // Obtener reto activo
    const challenge = await prisma.groupChallenge.findFirst({
      where: {
        groupId,
        status: 'ACTIVE'
      }
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'No hay ningún reto activo para archivar'
      });
    }

    // Archivar reto
    const archivedChallenge = await prisma.groupChallenge.update({
      where: { id: challenge.id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      data: archivedChallenge,
      message: 'Reto archivado correctamente'
    });

  } catch (error) {
    console.error('Error archivando reto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al archivar reto',
      error: error.message
    });
  }
};

module.exports = {
  createChallenge,
  getActiveChallenge,
  getChallengeProgress,
  updateChallengeProgress,
  getChallengeRanking,
  archiveChallenge
};
*/