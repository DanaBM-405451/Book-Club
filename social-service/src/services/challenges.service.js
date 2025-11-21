// src/services/challenges.service.js
const { prisma } = require('../config/database');
const externalService = require('./external.service');
const { 
  calculateProgress, 
  calculateChallengePoints, 
  createPaginatedResponse,
  createNotificationMetadata,
  generateRanking
} = require('../utils/helpers');

class ChallengesService {
  /**
   * Crear reto de lectura
   * Historia 5.7: Retos de lectura grupales
   */
  async createChallenge(groupId, userId, data, token) {
    try {
      const { 
        bookId, 
        bookTitle, 
        bookAuthor,
        bookCoverUrl,
        totalPages,
        startDate, 
        endDate,
        description,
        fromProposalId 
      } = data;

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Debes ser miembro del grupo para crear retos');
      }

      // Verificar que el libro existe
     //  Intentar validar libro (opcional)
let bookInfo = null;
try {
  bookInfo = await externalService.getBookById(bookId, token);
} catch (error) {
  console.warn('No se pudo validar el libro:', error.message);
}

      // Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
      }

      if (start < new Date()) {
        throw new Error('La fecha de inicio no puede ser en el pasado');
      }

      // Archivar retos activos anteriores del grupo
      await prisma.groupChallenge.updateMany({
        where: {
          groupId,
          status: 'ACTIVE',
        },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
        },
      });

      // Crear el reto
      const challenge = await prisma.groupChallenge.create({
        data: {
          groupId,
          createdBy: userId,
          bookId,
          bookTitle: bookTitle || bookInfo?.title || 'Sin título',
          bookAuthor: bookAuthor || bookInfo?.author || null,
          bookCoverUrl: bookCoverUrl || bookInfo?.coverImageUrl || null,
          totalPages: totalPages || bookInfo?.pageCount || 0,
          startDate: start,
          endDate: end,
          description,
          fromProposalId,
          status: 'ACTIVE',
        },
      });

      // Unir automáticamente al creador
      await this.joinChallenge(groupId, challenge.id, userId, token);

      // Notificar a todos los miembros del grupo
      await this.notifyGroupMembers(
        groupId,
        userId,
        'CHALLENGE_STARTED',
        'Nuevo reto de lectura',
        `Se ha creado un reto de lectura: ${challenge.bookTitle}`,
        { challengeId: challenge.id, groupId }
      );

      // Otorgar puntos XP por crear reto
      await externalService.awardXP(
        userId,
        15,
        'Crear reto de lectura grupal',
        token
      );

      return challenge;
    } catch (error) {
      console.error('Error creando reto:', error);
      throw error;
    }
  }

  /**
   * Listar retos del grupo
   * Historia 5.7: Ver retos
   */
  async getGroupChallenges(groupId, userId, includeArchived = false, page = 1, limit = 20, token) {
    try {
      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver los retos del grupo');
      }

      const skip = (page - 1) * limit;

      const where = {
        groupId,
        ...(includeArchived ? {} : { status: { not: 'ARCHIVED' } }),
      };

      const [challenges, total] = await Promise.all([
        prisma.groupChallenge.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            _count: {
              select: {
                progress: true,
              },
            },
          },
        }),
        prisma.groupChallenge.count({ where }),
      ]);

      // Mapear con información adicional
      const challengesWithInfo = challenges.map(challenge => {
        const now = new Date();
        const end = new Date(challenge.endDate);
        const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

        return {
          ...challenge,
          participantsCount: challenge._count.progress,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          isExpired: end < now,
        };
      });

      return createPaginatedResponse(challengesWithInfo, page, limit, total);
    } catch (error) {
      console.error('Error obteniendo retos del grupo:', error);
      throw error;
    }
  }

  /**
   * Obtener reto activo del grupo
   */
  async getActiveChallenge(groupId, userId, token) {
    try {
      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver los retos del grupo');
      }

      const challenge = await prisma.groupChallenge.findFirst({
        where: {
          groupId,
          status: 'ACTIVE',
        },
        include: {
          _count: {
            select: {
              progress: true,
            },
          },
        },
      });

      if (!challenge) {
        return null;
      }

      const now = new Date();
      const end = new Date(challenge.endDate);
      const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

      // Verificar si el usuario está participando
      const userProgress = await prisma.challengeProgress.findUnique({
        where: {
          challengeId_userId: {
            challengeId: challenge.id,
            userId,
          },
        },
      });

      return {
        ...challenge,
        participantsCount: challenge._count.progress,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isExpired: end < now,
        userProgress: userProgress || null,
      };
    } catch (error) {
      console.error('Error obteniendo reto activo:', error);
      throw error;
    }
  }

  /**
   * Obtener detalle de un reto
   */
  async getChallengeById(groupId, challengeId, userId, token) {
    try {
      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver los retos');
      }

      const challenge = await prisma.groupChallenge.findUnique({
        where: { id: challengeId },
        include: {
          progress: true,
          _count: {
            select: {
              progress: true,
            },
          },
        },
      });

      if (!challenge || challenge.groupId !== groupId) {
        throw new Error('Reto no encontrado');
      }

      // Obtener información del libro
      let book = null;
      try {
        book = await externalService.getBookById(challenge.bookId, token);
      } catch (error) {
        console.error(`Error obteniendo libro ${challenge.bookId}:`, error);
      }

      // Calcular progreso promedio del grupo
      const avgProgress = challenge.progress.length > 0
        ? challenge.progress.reduce((sum, p) => sum + parseFloat(p.progressPercent), 0) / challenge.progress.length
        : 0;

      // Verificar si el usuario está participando
      const userProgress = challenge.progress.find(p => p.userId === userId);

      const now = new Date();
      const end = new Date(challenge.endDate);
      const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

      return {
        ...challenge,
        book,
        participantsCount: challenge._count.progress,
        averageProgress: parseFloat(avgProgress.toFixed(2)),
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isExpired: end < now,
        userProgress: userProgress || null,
      };
    } catch (error) {
      console.error('Error obteniendo reto:', error);
      throw error;
    }
  }

  /**
   * Unirse a un reto
   * Historia 5.7: Participar en reto
   */
  async joinChallenge(groupId, challengeId, userId, token) {
    try {
      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Debes ser miembro del grupo para unirte al reto');
      }

      // Verificar que el reto existe y está activo
      const challenge = await prisma.groupChallenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge || challenge.groupId !== groupId) {
        throw new Error('Reto no encontrado');
      }

      if (challenge.status !== 'ACTIVE') {
        throw new Error('Este reto ya no está activo');
      }

      // Verificar si ya está participando
      const existingProgress = await prisma.challengeProgress.findUnique({
        where: {
          challengeId_userId: {
            challengeId,
            userId,
          },
        },
      });

      if (existingProgress) {
        throw new Error('Ya estás participando en este reto');
      }

      // Unirse al reto
      const progress = await prisma.challengeProgress.create({
        data: {
          challengeId,
          userId,
          currentPage: 0,
          progressPercent: 0,
        },
      });

      // Otorgar puntos XP por unirse
      await externalService.awardXP(
        userId,
        5,
        'Unirse a reto de lectura grupal',
        token
      );

      return progress;
    } catch (error) {
      console.error('Error uniéndose al reto:', error);
      throw error;
    }
  }

  /**
   * Actualizar progreso en el reto
   * Historia 5.7: Actualizar progreso
   */
  async updateProgress(groupId, challengeId, userId, data, token) {
    try {
      const { currentPage } = data;

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Debes ser miembro del grupo');
      }

      // Obtener el reto
      const challenge = await prisma.groupChallenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge || challenge.groupId !== groupId) {
        throw new Error('Reto no encontrado');
      }

      // Obtener progreso actual
      const progress = await prisma.challengeProgress.findUnique({
        where: {
          challengeId_userId: {
            challengeId,
            userId,
          },
        },
      });

      if (!progress) {
        throw new Error('No estás participando en este reto');
      }

      // Validar página actual
      if (currentPage < 0 || currentPage > challenge.totalPages) {
        throw new Error('Página inválida');
      }

      // Calcular porcentaje
      const progressPercent = calculateProgress(currentPage, challenge.totalPages);

      // Verificar si completó el reto
      const wasCompleted = progress.isCompleted;
      const isNowCompleted = progressPercent >= 100;

      // Calcular puntos
      let pointsToAward = 0;
      if (!wasCompleted && isNowCompleted) {
        pointsToAward = calculateChallengePoints(progressPercent, challenge.totalPages);
      }

      // Actualizar progreso
      const updated = await prisma.challengeProgress.update({
        where: {
          challengeId_userId: {
            challengeId,
            userId,
          },
        },
        data: {
          currentPage,
          progressPercent,
          isCompleted: isNowCompleted,
          completedAt: isNowCompleted && !wasCompleted ? new Date() : progress.completedAt,
          pointsEarned: progress.pointsEarned + pointsToAward,
        },
      });

      // Otorgar puntos XP si completó
      if (!wasCompleted && isNowCompleted) {
        await externalService.awardXP(
          userId,
          pointsToAward,
          `Completar reto de lectura: ${challenge.bookTitle}`,
          token
        );

        // Notificar al grupo
        await this.notifyGroupMembers(
          groupId,
          userId,
          'CHALLENGE_COMPLETED',
          'Reto completado',
          `¡Un miembro ha completado el reto de lectura!`,
          { challengeId, userId, groupId }
        );
      }

      return updated;
    } catch (error) {
      console.error('Error actualizando progreso:', error);
      throw error;
    }
  }

  /**
   * Obtener progreso general del reto
   * Historia 5.7: Ver progreso de todos
   */
  async getChallengeProgress(groupId, challengeId, userId, token) {
    try {
      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver el progreso');
      }

      // Obtener el reto
      const challenge = await prisma.groupChallenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge || challenge.groupId !== groupId) {
        throw new Error('Reto no encontrado');
      }

      // Obtener progreso de todos los participantes
      const allProgress = await prisma.challengeProgress.findMany({
        where: { challengeId },
        orderBy: [
          { isCompleted: 'desc' },
          { progressPercent: 'desc' },
          { updatedAt: 'desc' },
        ],
      });

      // Obtener perfiles de los participantes
      const participantIds = allProgress.map(p => p.userId);
      const profiles = await externalService.getUserProfiles(participantIds, token);
      const profileMap = new Map(profiles.map(p => [p.userId, p]));

      // Mapear progreso con perfiles
      const progressWithProfiles = allProgress.map(p => ({
        ...p,
        user: profileMap.get(p.userId) || null,
      }));

      // Calcular promedio general
      const avgProgress = allProgress.length > 0
        ? allProgress.reduce((sum, p) => sum + parseFloat(p.progressPercent), 0) / allProgress.length
        : 0;

      // Contar completados
      const completedCount = allProgress.filter(p => p.isCompleted).length;

      return {
        challenge: {
          id: challenge.id,
          bookTitle: challenge.bookTitle,
          totalPages: challenge.totalPages,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
        },
        participants: progressWithProfiles,
        stats: {
          totalParticipants: allProgress.length,
          completedCount,
          averageProgress: parseFloat(avgProgress.toFixed(2)),
        },
      };
    } catch (error) {
      console.error('Error obteniendo progreso del reto:', error);
      throw error;
    }
  }

  /**
   * Obtener ranking del reto
   * Historia 5.7: Ranking
   */
  async getChallengeRanking(groupId, challengeId, userId, token) {
    try {
      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver el ranking');
      }

      // Obtener el reto
      const challenge = await prisma.groupChallenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge || challenge.groupId !== groupId) {
        throw new Error('Reto no encontrado');
      }

      // Obtener progreso de todos
      const allProgress = await prisma.challengeProgress.findMany({
        where: { challengeId },
      });

      // Obtener perfiles
      const participantIds = allProgress.map(p => p.userId);
      const profiles = await externalService.getUserProfiles(participantIds, token);
      const profileMap = new Map(profiles.map(p => [p.userId, p]));

      // Mapear con perfiles
      const progressWithProfiles = allProgress.map(p => ({
        ...p,
        user: profileMap.get(p.userId) || null,
      }));

      // Generar ranking
      const ranking = generateRanking(progressWithProfiles);

      return {
        challenge: {
          id: challenge.id,
          bookTitle: challenge.bookTitle,
          status: challenge.status,
        },
        ranking,
      };
    } catch (error) {
      console.error('Error obteniendo ranking del reto:', error);
      throw error;
    }
  }

  /**
   * Archivar reto (manual por admin o automático)
   * Historia 5.7: Archivado automático
   */
  async archiveChallenge(groupId, challengeId, userId) {
    try {
      // Verificar que el usuario es admin del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede archivar retos');
      }

      // Verificar que el reto existe
      const challenge = await prisma.groupChallenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge || challenge.groupId !== groupId) {
        throw new Error('Reto no encontrado');
      }

      // Archivar el reto
      const archived = await prisma.groupChallenge.update({
        where: { id: challengeId },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
        },
      });

      // Notificar a los participantes
      await this.notifyGroupMembers(
        groupId,
        userId,
        'CHALLENGE_ARCHIVED',
        'Reto archivado',
        `El reto "${challenge.bookTitle}" ha sido archivado`,
        { challengeId, groupId }
      );

      return archived;
    } catch (error) {
      console.error('Error archivando reto:', error);
      throw error;
    }
  }

  /**
   * Verificar y archivar retos vencidos automáticamente
   */
  async checkExpiredChallenges() {
    try {
      const expiredChallenges = await prisma.groupChallenge.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            lt: new Date(),
          },
        },
      });

      for (const challenge of expiredChallenges) {
        await prisma.groupChallenge.update({
          where: { id: challenge.id },
          data: {
            status: 'ARCHIVED',
            archivedAt: new Date(),
          },
        });

        // Notificar al grupo
        await this.notifyGroupMembers(
          challenge.groupId,
          challenge.createdBy,
          'CHALLENGE_ARCHIVED',
          'Reto finalizado',
          `El reto "${challenge.bookTitle}" ha finalizado`,
          { challengeId: challenge.id, groupId: challenge.groupId }
        );
      }

      return expiredChallenges.length;
    } catch (error) {
      console.error('Error verificando retos vencidos:', error);
      return 0;
    }
  }

  /**
   * Reactivar reto archivado
   * Historia 5.7: Reactivar reto
   */
  async reactivateChallenge(groupId, challengeId, userId, newEndDate) {
    try {
      // Verificar que el usuario es admin del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede reactivar retos');
      }

      // Verificar que el reto existe y está archivado
      const challenge = await prisma.groupChallenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge || challenge.groupId !== groupId) {
        throw new Error('Reto no encontrado');
      }

      if (challenge.status !== 'ARCHIVED') {
        throw new Error('Solo se pueden reactivar retos archivados');
      }

      // Validar nueva fecha de fin
      const end = new Date(newEndDate);
      if (end <= new Date()) {
        throw new Error('La fecha de fin debe ser futura');
      }

      // Archivar otros retos activos
      await prisma.groupChallenge.updateMany({
        where: {
          groupId,
          status: 'ACTIVE',
        },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
        },
      });

      // Reactivar el reto
      const reactivated = await prisma.groupChallenge.update({
        where: { id: challengeId },
        data: {
          status: 'ACTIVE',
          endDate: end,
          archivedAt: null,
        },
      });

      // Notificar al grupo
      await this.notifyGroupMembers(
        groupId,
        userId,
        'CHALLENGE_STARTED',
        'Reto reactivado',
        `El reto "${challenge.bookTitle}" ha sido reactivado`,
        { challengeId, groupId }
      );

      return reactivated;
    } catch (error) {
      console.error('Error reactivando reto:', error);
      throw error;
    }
  }

  /**
   * Notificar a todos los miembros del grupo
   */
  async notifyGroupMembers(groupId, excludeUserId, type, title, message, metadata = {}) {
    try {
      const members = await prisma.groupMember.findMany({
        where: {
          groupId,
          userId: { not: excludeUserId },
        },
        select: {
          userId: true,
        },
      });

      const notifications = members.map(member =>
        this.createNotification(member.userId, excludeUserId, type, title, message, metadata)
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Error notificando a miembros del grupo:', error);
    }
  }

  /**
   * Crear notificación
   */
  async createNotification(userId, senderId, type, title, message, metadata = {}) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          senderId,
          type,
          title,
          message,
          metadata: createNotificationMetadata(type, metadata),
        },
      });
    } catch (error) {
      console.error('Error creando notificación:', error);
      return null;
    }
  }
}

module.exports = new ChallengesService();