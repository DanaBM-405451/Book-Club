// src/services/challenges.service.js

const { prisma } = require('../config/database');
const externalService = require('./external.service');

class ChallengesService {
  /**
   * Obtener retos del grupo
   */
  async getChallenges(groupId, includeArchived = false) {
    try {
      const where = { groupId };
      
      if (!includeArchived) {
        where.status = 'ACTIVE';
      }

      const challenges = await prisma.groupChallenge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { progress: true }
          }
        }
      });

      return challenges.map(challenge => {
        const now = new Date();
        const endDate = new Date(challenge.endDate);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        return {
          ...challenge,
          progressCount: challenge._count.progress,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          isExpired: endDate < now && challenge.status === 'ACTIVE'
        };
      });

    } catch (error) {
      console.error('Error obteniendo retos:', error);
      throw new Error('No se pudieron obtener los retos');
    }
  }

  /**
   * Crear un reto de lectura manualmente
   */
  async createChallenge(groupId, userId, data, token) {
    try {
      const {
        bookId,
        bookTitle,
        bookAuthor,
        totalPages,
        startDate,
        endDate,
        description
      } = data;

      // 1. Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede crear retos');
      }

      // 2. Verificar que no haya otro reto activo
      const activeChallenge = await prisma.groupChallenge.findFirst({
        where: { groupId, status: 'ACTIVE' }
      });

      if (activeChallenge) {
        throw new Error('Ya existe un reto activo. Complétalo o archívalo antes de crear uno nuevo.');
      }

      // 3. Obtener la URL de la portada (Lógica corregida)
      let coverUrl = null; // Declaramos la variable AQUÍ, fuera del try/if

      if (bookId) {
         try {
            // Intentamos buscar el libro en el servicio de librería
            const bookInfo = await externalService.getBookById(bookId, token);
            // Si lo encontramos, asignamos la portada
            if (bookInfo && bookInfo.coverImageUrl) {
                coverUrl = bookInfo.coverImageUrl;
            }
         } catch (e) { 
            console.log("No se pudo obtener portada del libro (no crítico):", e.message); 
            // Si falla, coverUrl sigue siendo null, no pasa nada.
         }
      }

      // 4. Crear el reto
      const challenge = await prisma.groupChallenge.create({
        data: {
          groupId: parseInt(groupId), // Aseguramos entero
          bookId: parseInt(bookId),   // Aseguramos entero
          bookTitle,
          bookAuthor,
          bookCoverUrl: coverUrl, // ✅ Usamos la variable declarada arriba
          totalPages: parseInt(totalPages),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          description,
          status: 'ACTIVE',
          createdBy: userId // El creador
        }
      });

      // 5. Otorgar XP al creador
      try {
        await externalService.awardXP(userId, 15, 'Crear reto de grupo', token);
      } catch (error) { console.log('Error XP:', error.message); }

      return challenge;

    } catch (error) {
      console.error('Error creando reto:', error);
      throw error;
    }
  }

  /**
   * Obtener reto activo con progreso del usuario
   */
  async getActiveChallenge(groupId, userId) {
    try {
      const challenge = await prisma.groupChallenge.findFirst({
        where: {
          groupId,
          status: 'ACTIVE'
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          _count: {
            select: { progress: true }
          },
          progress: {
            where: { userId }
          }
        }
      });

      if (!challenge) {
        return null;
      }

      const now = new Date();
      const endDate = new Date(challenge.endDate);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      const userProgress = challenge.progress[0] || null;

      return {
        ...challenge,
        progressCount: challenge._count.progress,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isExpired: endDate < now,
        userProgress: userProgress ? {
          currentPage: userProgress.currentPage,
          progressPercent: Math.round((userProgress.currentPage / challenge.totalPages) * 100),
          isCompleted: userProgress.isCompleted
        } : null
      };

    } catch (error) {
      console.error('Error obteniendo reto activo:', error);
      throw new Error('No se pudo obtener el reto activo');
    }
  }

  /**
   * Unirse a un reto
   */
  async joinChallenge(groupId, challengeId, userId, token) {
    try {
      // Verificar que el usuario es miembro
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership) {
        throw new Error('Debes ser miembro del grupo para unirte al reto');
      }

      // Verificar que el reto existe y está activo
      const challenge = await prisma.groupChallenge.findUnique({
        where: { id: challengeId }
      });

      if (!challenge || challenge.groupId !== groupId) {
        throw new Error('Reto no encontrado');
      }

      if (challenge.status !== 'ACTIVE') {
        throw new Error('Este reto ya no está activo');
      }

      // Verificar si ya está participando
      const existing = await prisma.challengeProgress.findUnique({
        where: {
          challengeId_userId: { challengeId, userId }
        }
      });

      if (existing) {
        throw new Error('Ya estás participando en este reto');
      }

      // Crear participación
      const participation = await prisma.challengeProgress.create({
        data: {
          challengeId,
          userId,
          currentPage: 0,
          isCompleted: false
        }
      });

      // Otorgar XP
      try {
        await externalService.awardXP(
          userId,
          10,
          'Unirse a reto de lectura',
          token
        );
      } catch (error) {
        console.log('Error otorgando XP:', error.message);
      }

      return participation;

    } catch (error) {
      console.error('Error uniéndose al reto:', error);
      throw error;
    }
  }

  /**
   * Actualizar progreso en un reto
   */
  async updateProgress(groupId, challengeId, userId, currentPage, token) {
    try {
      // Obtener el reto
      const challenge = await prisma.groupChallenge.findUnique({
        where: { id: challengeId }
      });

      if (!challenge || challenge.groupId !== groupId) {
        throw new Error('Reto no encontrado');
      }

      if (currentPage < 0 || currentPage > challenge.totalPages) {
        throw new Error(`La página debe estar entre 0 y ${challenge.totalPages}`);
      }

      // Verificar participación
      const participation = await prisma.challengeProgress.findUnique({
        where: {
          challengeId_userId: { challengeId, userId }
        }
      });

      if (!participation) {
        throw new Error('No estás participando en este reto');
      }

      // Actualizar progreso
      const wasCompleted = participation.isCompleted;
      const isNowCompleted = currentPage >= challenge.totalPages;

      const updated = await prisma.challengeProgress.update({
        where: {
          challengeId_userId: { challengeId, userId }
        },
        data: {
          currentPage,
          isCompleted: isNowCompleted,
          updatedAt: new Date()
        }
      });

      // Si acaba de completar el reto, otorgar XP bonus
      if (!wasCompleted && isNowCompleted) {
        try {
          await externalService.awardXP(
            userId,
            50,
            'Completar reto de lectura',
            token
          );
        } catch (error) {
          console.log('Error otorgando XP:', error.message);
        }
      }

      return updated;

    } catch (error) {
      console.error('Error actualizando progreso:', error);
      throw error;
    }
  }

  /**
   * Obtener ranking del reto
   */
  async getRanking(groupId, challengeId, token) {
    try {
      // 1. Verificar que el reto existe
      const challenge = await prisma.groupChallenge.findUnique({
        where: { id: challengeId }
      });

      if (!challenge || challenge.groupId !== groupId) {
        throw new Error('Reto no encontrado');
      }

      // 2. Obtener progresos
      // NOTA: Asegúrate de que tu prisma client está generado (npx prisma generate)
      const progressList = await prisma.challengeProgress.findMany({
        where: { challengeId: challengeId },
        orderBy: [
          { progressPercent: 'desc' }, // Mayor % primero
          { updatedAt: 'asc' }         // En empate, quien actualizó primero gana
        ],
        take: 20
      });

      if (progressList.length === 0) {
        return [];
      }

      // 3. Obtener perfiles de usuarios (para mostrar nombres y avatares)
      const userIds = progressList.map(p => p.userId);
      let profiles = [];
      try {
        profiles = await externalService.getUserProfiles(userIds, token);
      } catch (e) {
        console.log("No se pudieron cargar perfiles para el ranking");
      }
      
      const profileMap = new Map(profiles.map(p => [p.userId, p]));

      // 4. Formatear respuesta
      const formattedRanking = progressList.map((entry, index) => ({
        position: index + 1,
        userId: entry.userId,
        user: profileMap.get(entry.userId) || { username: 'Usuario' },
        currentPage: entry.currentPage,
        progressPercent: Number(entry.progressPercent), // Convertir Decimal a Number
        isCompleted: entry.isCompleted,
        pointsEarned: entry.pointsEarned
      }));

      return formattedRanking;

    } catch (error) {
      console.error('Error obteniendo ranking:', error);
      throw error;
    }
  }
  /**
   * Archivar un reto
   */
  async archiveChallenge(groupId, challengeId, userId) {
    try {
      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede archivar retos');
      }

      // Archivar el reto
      const challenge = await prisma.groupChallenge.update({
        where: { id: challengeId },
        data: {
          status: 'ARCHIVED',
          updatedAt: new Date()
        }
      });

      return challenge;

    } catch (error) {
      console.error('Error archivando reto:', error);
      throw error;
    }
  }

  /**
   * Reactivar un reto archivado
   */
  async reactivateChallenge(groupId, challengeId, userId, newEndDate) {
    try {
      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede reactivar retos');
      }

      // Reactivar el reto
      const challenge = await prisma.groupChallenge.update({
        where: { id: challengeId },
        data: {
          status: 'ACTIVE',
          endDate: new Date(newEndDate),
          updatedAt: new Date()
        }
      });

      return challenge;

    } catch (error) {
      console.error('Error reactivando reto:', error);
      throw error;
    }
  }
}

module.exports = new ChallengesService();