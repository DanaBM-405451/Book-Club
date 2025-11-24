// src/services/proposals.service.js

const { prisma } = require('../config/database');
const externalService = require('./external.service');

class ProposalsService {
  /**
   * Obtener propuestas del grupo
   */
  async getProposals(groupId, userId, includeInactive = false) {
    try {
      const where = { groupId };
      
      if (!includeInactive) {
        where.status = 'ACTIVE';
      }

      const proposals = await prisma.groupBookProposal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { votes: true }
          },
          votes: {
            where: { userId }
          }
        }
      });

      // Obtener información de los proponentes
      const proposerIds = [...new Set(proposals.map(p => p.proposedBy))];
      const proposers = await externalService.getUserProfiles(proposerIds, null);
      const proposerMap = new Map(proposers.map(p => [p.userId, p]));

      return proposals.map(proposal => {
        const now = new Date();
        const endDate = proposal.votingEndDate ? new Date(proposal.votingEndDate) : null;
        
        return {
          id: proposal.id,
          groupId: proposal.groupId,
          bookId: proposal.bookId,
          bookTitle: proposal.bookTitle,
          bookAuthor: proposal.bookAuthor,
          bookDescription: proposal.bookDescription,
          bookCoverUrl: proposal.bookCoverUrl,
          proposedBy: proposal.proposedBy,
          votingEndDate: proposal.votingEndDate,
          status: proposal.status,
          isWinner: proposal.isWinner,
          createdAt: proposal.createdAt,
          proposer: proposerMap.get(proposal.proposedBy) || { username: 'Usuario' },
          totalVotes: proposal._count.votes,
          hasUserVoted: proposal.votes.length > 0,
          isExpired: endDate && endDate < now && proposal.status === 'ACTIVE'
        };
      });

    } catch (error) {
      console.error('Error obteniendo propuestas:', error);
      throw new Error('No se pudieron obtener las propuestas');
    }
  }

  /**
   * Crear una propuesta de libro
   */
  async createProposal(groupId, userId, data, token) {
    try {
      const { bookId, bookTitle, bookAuthor, bookDescription, votingEndDate } = data;

      // Verificar que el usuario es miembro
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership) {
        throw new Error('Debes ser miembro del grupo para proponer libros');
      }

      // Crear la propuesta
      const proposal = await prisma.groupBookProposal.create({
        data: {
          groupId,
          bookId: bookId ? parseInt(bookId) : null,
          bookTitle,
          bookAuthor,
          bookDescription,
          bookCoverUrl: null,
          proposedBy: userId,
          votingEndDate: votingEndDate ? new Date(votingEndDate) : null,
          status: 'ACTIVE'
        }
      });

      // Otorgar XP
      try {
        await externalService.awardXP(
          userId,
          10,
          'Proponer libro en grupo',
          token
        );
      } catch (error) {
        console.log('Error otorgando XP:', error.message);
      }

      return proposal;

    } catch (error) {
      console.error('Error creando propuesta:', error);
      throw error;
    }
  }

  /**
   * Votar por una propuesta
   */
  async voteProposal(groupId, proposalId, userId) {
    try {
      // Verificar que el usuario es miembro
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership) {
        throw new Error('Debes ser miembro del grupo para votar');
      }

      // Verificar que la propuesta existe y está activa
      const proposal = await prisma.groupBookProposal.findUnique({
        where: { id: proposalId }
      });

      if (!proposal || proposal.groupId !== groupId) {
        throw new Error('Propuesta no encontrada');
      }

      if (proposal.status !== 'ACTIVE') {
        throw new Error('Esta propuesta ya no está activa');
      }

      // Verificar si ya votó
      const existingVote = await prisma.proposalVote.findUnique({
        where: {
          proposalId_userId: { proposalId, userId }
        }
      });

      if (existingVote) {
        // Si ya votó, quitar el voto
        await prisma.proposalVote.delete({
          where: {
            proposalId_userId: { proposalId, userId }
          }
        });
        return { action: 'removed', message: 'Voto removido' };
      }

      // Crear el voto
      const vote = await prisma.proposalVote.create({
        data: {
          proposalId,
          userId
        }
      });

      return { action: 'added', message: 'Voto registrado', vote };

    } catch (error) {
      console.error('Error votando propuesta:', error);
      throw error;
    }
  }

  /**
   * Cerrar votación, determinar ganador y CREAR RETO AUTOMÁTICO
   */
  async closeProposal(groupId, proposalId, userId, token) {
    try {
      // 1. Verificar permisos (Admin)
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede cerrar votaciones');
      }

      // 2. Obtener propuestas activas
      const proposals = await prisma.groupBookProposal.findMany({
        where: { groupId, status: 'ACTIVE' },
        include: { _count: { select: { votes: true } } }
      });

      if (proposals.length === 0) {
        throw new Error('No hay propuestas activas');
      }

      // 3. Encontrar ganador
      const winner = proposals.reduce((max, proposal) =>
        proposal._count.votes > max._count.votes ? proposal : max
      );

      // 4. TRANSACCIÓN: Cerrar propuestas y CREAR RETO
      await prisma.$transaction(async (tx) => {
        // a) Marcar ganador
        await tx.groupBookProposal.update({
          where: { id: winner.id },
          data: { status: 'CLOSED', isWinner: true }
        });

        // b) Cerrar las demás
        await tx.groupBookProposal.updateMany({
          where: { groupId, status: 'ACTIVE', id: { not: winner.id } },
          data: { status: 'CLOSED', isWinner: false }
        });

        // c) ✅ CREAR RETO AUTOMÁTICAMENTE
        // Calculamos fecha de fin por defecto (ej: 30 días)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        await tx.groupChallenge.create({
          data: {
            groupId,
            createdBy: userId,
            bookId: winner.bookId || 0, // Si fue manual, bookId puede ser null
            bookTitle: winner.bookTitle,
            bookAuthor: winner.bookAuthor,
            bookCoverUrl: winner.bookCoverUrl,
            totalPages: 300, // Default si no tenemos el dato, o búscalo en library-service si bookId existe
            fromProposalId: winner.id,
            startDate,
            endDate,
            status: 'ACTIVE',
            description: `Reto generado automáticamente a partir del libro ganador: "${winner.bookTitle}"`
          }
        });
      });

      // 5. Otorgar XP
      try {
        await externalService.awardXP(winner.proposedBy, 20, 'Propuesta ganadora', token);
      } catch (e) { console.log('Error XP:', e.message); }

      return { winner, message: 'Votación cerrada y reto creado' };

    } catch (error) {
      console.error('Error cerrando propuesta:', error);
      throw error;
    }
  }

  /**
   * Cancelar una propuesta
   */
  async cancelProposal(groupId, proposalId, userId) {
    try {
      const proposal = await prisma.groupBookProposal.findUnique({
        where: { id: proposalId }
      });

      if (!proposal || proposal.groupId !== groupId) {
        throw new Error('Propuesta no encontrada');
      }

      // Verificar permisos
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      const canCancel = proposal.proposedBy === userId ||
                       (membership && membership.role === 'ADMIN');

      if (!canCancel) {
        throw new Error('No tienes permiso para cancelar esta propuesta');
      }

      // Eliminar votos
      await prisma.proposalVote.deleteMany({
        where: { proposalId }
      });

      // Eliminar propuesta
      await prisma.groupBookProposal.delete({
        where: { id: proposalId }
      });

      return { message: 'Propuesta cancelada correctamente' };

    } catch (error) {
      console.error('Error cancelando propuesta:', error);
      throw error;
    }
  }

  /**
   * Obtener libro ganador actual
   */
  async getWinner(groupId) {
    try {
      const winner = await prisma.groupBookProposal.findFirst({
        where: {
          groupId,
          isWinner: true,
          status: 'CLOSED'
        },
        orderBy: {
          updatedAt: 'desc'
        },
        include: {
          _count: {
            select: { votes: true }
          }
        }
      });

      if (!winner) {
        return null;
      }

      // Obtener información del proponente
      const proposer = await externalService.getUserProfile(winner.proposedBy, null);

      return {
        ...winner,
        proposer: proposer || { username: 'Usuario' },
        totalVotes: winner._count.votes
      };

    } catch (error) {
      console.error('Error obteniendo ganador:', error);
      throw new Error('No se pudo obtener el libro ganador');
    }
  }
}

module.exports = new ProposalsService();