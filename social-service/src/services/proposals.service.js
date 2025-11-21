// src/services/proposals.service.js
const { prisma } = require('../config/database');
const externalService = require('./external.service');
const { createPaginatedResponse, createNotificationMetadata } = require('../utils/helpers');

class ProposalsService {
  /**
   * Crear propuesta de libro
   * Historia 5.6: Selección de libro dentro del grupo
   */
  async createProposal(groupId, userId, data, token) {
    try {
      const { 
        bookId, 
        bookTitle, 
        bookAuthor, 
        bookCoverUrl, 
        bookDescription,
        source, 
        votingEndDate 
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
        throw new Error('Debes ser miembro del grupo para proponer libros');
      }

      // Verificar si ya existe una propuesta activa para este libro en el grupo
      if (bookId) {
        const existingProposal = await prisma.groupBookProposal.findFirst({
          where: {
            groupId,
            bookId,
            status: 'ACTIVE',
          },
        });

        if (existingProposal) {
          throw new Error('Este libro ya está propuesto en una votación activa');
        }
      }

      // Si hay bookId, verificar que el libro existe
let bookInfo = null;
if (bookId && source !== 'MANUAL') {
  try {
    bookInfo = await externalService.getBookById(bookId, token);
  } catch (error) {
    console.warn('No se pudo validar el libro:', error.message);
  }
}

      // Crear la propuesta
      const proposal = await prisma.groupBookProposal.create({
        data: {
          groupId,
          proposedBy: userId,
          bookId,
          bookTitle: bookTitle || bookInfo?.title || 'Sin título',
          bookAuthor: bookAuthor || bookInfo?.author || null,
          bookCoverUrl: bookCoverUrl || bookInfo?.coverImageUrl || null,
          bookDescription: bookDescription || bookInfo?.description || null,
          source,
          votingEndDate: votingEndDate ? new Date(votingEndDate) : null,
          status: 'ACTIVE',
        },
      });

      // Votar automáticamente por la propia propuesta
      await this.voteProposal(groupId, proposal.id, userId, token);

      // Notificar a todos los miembros del grupo
      await this.notifyGroupMembers(
        groupId,
        userId,
        'PROPOSAL_CREATED',
        'Nueva propuesta de libro',
        `Se ha propuesto un nuevo libro: ${proposal.bookTitle}`,
        { proposalId: proposal.id, groupId }
      );

      return proposal;
    } catch (error) {
      console.error('Error creando propuesta:', error);
      throw error;
    }
  }

  /**
   * Listar propuestas del grupo
   * Historia 5.6: Selección de libro dentro del grupo
   */
  async getGroupProposals(groupId, userId, includeInactive = false, page = 1, limit = 20, token) {
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
        throw new Error('Solo los miembros pueden ver las propuestas del grupo');
      }

      const skip = (page - 1) * limit;

      const where = {
        groupId,
        ...(includeInactive ? {} : { status: 'ACTIVE' }),
      };

      const [proposals, total] = await Promise.all([
        prisma.groupBookProposal.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { isWinner: 'desc' }, // Ganadores primero
            { totalVotes: 'desc' }, // Más votados primero
            { createdAt: 'desc' }, // Más recientes primero
          ],
          include: {
            _count: {
              select: {
                votes: true,
              },
            },
          },
        }),
        prisma.groupBookProposal.count({ where }),
      ]);

      // Obtener perfiles de los proponentes
      const proposerIds = [...new Set(proposals.map(p => p.proposedBy))];
      const proposers = await externalService.getUserProfiles(proposerIds, token);
      const proposerMap = new Map(proposers.map(p => [p.userId, p]));

      // Verificar si el usuario actual votó por cada propuesta
      const userVotes = await prisma.proposalVote.findMany({
        where: {
          proposalId: { in: proposals.map(p => p.id) },
          userId,
        },
        select: {
          proposalId: true,
        },
      });

      const votedProposalIds = new Set(userVotes.map(v => v.proposalId));

      // Mapear propuestas con información adicional
      const proposalsWithInfo = proposals.map(proposal => ({
        ...proposal,
        proposer: proposerMap.get(proposal.proposedBy) || null,
        votesCount: proposal._count.votes,
        hasUserVoted: votedProposalIds.has(proposal.id),
        isExpired: proposal.votingEndDate ? new Date(proposal.votingEndDate) < new Date() : false,
      }));

      return createPaginatedResponse(proposalsWithInfo, page, limit, total);
    } catch (error) {
      console.error('Error obteniendo propuestas del grupo:', error);
      throw error;
    }
  }

  /**
   * Obtener detalle de una propuesta
   */
  async getProposalById(groupId, proposalId, userId, token) {
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
        throw new Error('Solo los miembros pueden ver las propuestas');
      }

      const proposal = await prisma.groupBookProposal.findUnique({
        where: { id: proposalId },
        include: {
          votes: true,
          _count: {
            select: {
              votes: true,
            },
          },
        },
      });

      if (!proposal || proposal.groupId !== groupId) {
        throw new Error('Propuesta no encontrada');
      }

      // Obtener perfil del proponente
      const proposer = await externalService.getUserProfile(proposal.proposedBy, token);

      // Obtener perfiles de los votantes
      const voterIds = proposal.votes.map(v => v.userId);
      const voters = await externalService.getUserProfiles(voterIds, token);

      // Verificar si el usuario actual votó
      const hasUserVoted = proposal.votes.some(v => v.userId === userId);

      return {
        ...proposal,
        proposer,
        voters,
        votesCount: proposal._count.votes,
        hasUserVoted,
        isExpired: proposal.votingEndDate ? new Date(proposal.votingEndDate) < new Date() : false,
      };
    } catch (error) {
      console.error('Error obteniendo propuesta:', error);
      throw error;
    }
  }

  /**
   * Votar por una propuesta
   * Historia 5.6: Un usuario puede votar una vez por propuesta
   */
  async voteProposal(groupId, proposalId, userId, token) {
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
        throw new Error('Debes ser miembro del grupo para votar');
      }

      // Verificar que la propuesta existe y está activa
      const proposal = await prisma.groupBookProposal.findUnique({
        where: { id: proposalId },
      });

      if (!proposal || proposal.groupId !== groupId) {
        throw new Error('Propuesta no encontrada');
      }

      if (proposal.status !== 'ACTIVE') {
        throw new Error('Esta propuesta ya está cerrada');
      }

      // Verificar si la votación ya expiró
      if (proposal.votingEndDate && new Date(proposal.votingEndDate) < new Date()) {
        throw new Error('La votación ya ha finalizado');
      }

      // Verificar si el usuario ya votó
      const existingVote = await prisma.proposalVote.findUnique({
        where: {
          proposalId_userId: {
            proposalId,
            userId,
          },
        },
      });

      if (existingVote) {
        // Si ya votó, quitar el voto (toggle)
        await prisma.proposalVote.delete({
          where: {
            proposalId_userId: {
              proposalId,
              userId,
            },
          },
        });

        // Decrementar contador
        await prisma.groupBookProposal.update({
          where: { id: proposalId },
          data: {
            totalVotes: {
              decrement: 1,
            },
          },
        });

        return { voted: false, message: 'Voto eliminado' };
      }

      // Crear voto
      await prisma.proposalVote.create({
        data: {
          proposalId,
          userId,
        },
      });

      // Incrementar contador
      await prisma.groupBookProposal.update({
        where: { id: proposalId },
        data: {
          totalVotes: {
            increment: 1,
          },
        },
      });

      // Notificar al proponente (si no es el mismo usuario)
      if (proposal.proposedBy !== userId) {
        await this.createNotification(
          proposal.proposedBy,
          userId,
          'NEW_VOTE',
          'Nuevo voto en tu propuesta',
          `Alguien votó por tu propuesta: ${proposal.bookTitle}`,
          { proposalId, groupId }
        );
      }

      return { voted: true, message: 'Voto registrado exitosamente' };
    } catch (error) {
      console.error('Error votando propuesta:', error);
      throw error;
    }
  }

  /**
   * Cerrar votación (manual por admin o automático)
   * Historia 5.6: Finalizar votación
   */
  async closeProposal(groupId, proposalId, userId) {
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
        throw new Error('Solo el administrador puede cerrar la votación');
      }

      // Verificar que la propuesta existe
      const proposal = await prisma.groupBookProposal.findUnique({
        where: { id: proposalId },
      });

      if (!proposal || proposal.groupId !== groupId) {
        throw new Error('Propuesta no encontrada');
      }

      if (proposal.status !== 'ACTIVE') {
        throw new Error('Esta propuesta ya está cerrada');
      }

      // Cerrar la propuesta
      const closed = await prisma.groupBookProposal.update({
        where: { id: proposalId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      // Determinar ganador si hay votos
      await this.determineWinner(groupId);

      return closed;
    } catch (error) {
      console.error('Error cerrando propuesta:', error);
      throw error;
    }
  }

  /**
   * Determinar ganador automáticamente
   * Historia 5.6: Libro ganador
   */
  async determineWinner(groupId) {
    try {
      // Buscar la propuesta con más votos que esté cerrada y sin ganador
      const proposals = await prisma.groupBookProposal.findMany({
        where: {
          groupId,
          status: 'CLOSED',
          isWinner: false,
        },
        orderBy: {
          totalVotes: 'desc',
        },
        take: 1,
      });

      if (proposals.length === 0) {
        return null;
      }

      const winner = proposals[0];

      // Marcar como ganador
      await prisma.groupBookProposal.update({
        where: { id: winner.id },
        data: {
          isWinner: true,
        },
      });

      // Notificar al proponente y a todos los miembros
      await this.notifyGroupMembers(
        groupId,
        winner.proposedBy,
        'PROPOSAL_WINNER',
        'Libro ganador seleccionado',
        `El libro "${winner.bookTitle}" ha ganado la votación`,
        { proposalId: winner.id, groupId }
      );

      return winner;
    } catch (error) {
      console.error('Error determinando ganador:', error);
      throw error;
    }
  }

  /**
   * Cancelar propuesta (solo admin o proponente)
   */
  async cancelProposal(groupId, proposalId, userId) {
    try {
      const proposal = await prisma.groupBookProposal.findUnique({
        where: { id: proposalId },
      });

      if (!proposal || proposal.groupId !== groupId) {
        throw new Error('Propuesta no encontrada');
      }

      // Verificar permisos: admin o proponente
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('No tienes permiso para cancelar esta propuesta');
      }

      const canCancel = proposal.proposedBy === userId || membership.role === 'ADMIN';

      if (!canCancel) {
        throw new Error('Solo el proponente o el administrador pueden cancelar esta propuesta');
      }

      if (proposal.status !== 'ACTIVE') {
        throw new Error('Esta propuesta ya está cerrada');
      }

      // Cancelar la propuesta
      return await prisma.groupBookProposal.update({
        where: { id: proposalId },
        data: {
          status: 'CANCELLED',
          closedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error cancelando propuesta:', error);
      throw error;
    }
  }

  /**
   * Obtener propuesta ganadora del grupo
   */
  async getWinningProposal(groupId, userId) {
    try {
      // Verificar que el usuario es miembro
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver las propuestas ganadoras');
      }

      const winner = await prisma.groupBookProposal.findFirst({
        where: {
          groupId,
          isWinner: true,
        },
        orderBy: {
          closedAt: 'desc',
        },
      });

      if (!winner) {
        return null;
      }

      return winner;
    } catch (error) {
      console.error('Error obteniendo propuesta ganadora:', error);
      throw error;
    }
  }

  /**
   * Verificar y cerrar propuestas vencidas automáticamente
   */
  async checkExpiredProposals() {
    try {
      const expiredProposals = await prisma.groupBookProposal.findMany({
        where: {
          status: 'ACTIVE',
          votingEndDate: {
            lt: new Date(),
          },
        },
      });

      for (const proposal of expiredProposals) {
        await prisma.groupBookProposal.update({
          where: { id: proposal.id },
          data: {
            status: 'CLOSED',
            closedAt: new Date(),
          },
        });

        // Determinar ganador
        await this.determineWinner(proposal.groupId);
      }

      return expiredProposals.length;
    } catch (error) {
      console.error('Error verificando propuestas vencidas:', error);
      return 0;
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

module.exports = new ProposalsService();