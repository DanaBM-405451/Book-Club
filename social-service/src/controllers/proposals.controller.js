// src/controllers/proposals.controller.js

const proposalsService = require('../services/proposals.service');

/**
 * Obtener propuestas del grupo
 * GET /groups/:groupId/proposals?includeInactive=false
 */
const getProposals = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const includeInactive = req.query.includeInactive === 'true';

    const result = await proposalsService.getProposals(
      parseInt(groupId),
      userId,
      includeInactive
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Propuestas obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo propuestas:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Crear una propuesta de libro
 * POST /groups/:groupId/proposals
 * Body: { bookId?, bookTitle, bookAuthor?, bookDescription?, votingEndDate? }
 */
const createProposal = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    if (!req.body.bookTitle || req.body.bookTitle.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El título del libro es requerido'
      });
    }

    const proposal = await proposalsService.createProposal(
      parseInt(groupId),
      userId,
      req.body,
      token
    );

    return res.status(201).json({
      success: true,
      data: proposal,
      message: 'Propuesta creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando propuesta:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Votar por una propuesta
 * POST /groups/:groupId/proposals/:proposalId/vote
 */
const voteProposal = async (req, res) => {
  try {
    const { groupId, proposalId } = req.params;
    const userId = req.user.id;

    const vote = await proposalsService.voteProposal(
      parseInt(groupId),
      parseInt(proposalId),
      userId
    );

    return res.status(200).json({
      success: true,
      data: vote,
      message: 'Voto registrado correctamente'
    });

  } catch (error) {
    console.error('Error votando propuesta:', error);
    const statusCode = error.message.includes('ya votaste') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Cerrar votación de una propuesta (solo admin)
 * POST /groups/:groupId/proposals/:proposalId/close
 */
const closeProposal = async (req, res) => {
  try {
    const { groupId, proposalId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    const result = await proposalsService.closeProposal(
      parseInt(groupId),
      parseInt(proposalId),
      userId,
      token
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Votación cerrada correctamente'
    });

  } catch (error) {
    console.error('Error cerrando propuesta:', error);
    const statusCode = error.message.includes('administrador') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Cancelar una propuesta
 * DELETE /groups/:groupId/proposals/:proposalId
 */
const cancelProposal = async (req, res) => {
  try {
    const { groupId, proposalId } = req.params;
    const userId = req.user.id;

    await proposalsService.cancelProposal(
      parseInt(groupId),
      parseInt(proposalId),
      userId
    );

    return res.status(200).json({
      success: true,
      message: 'Propuesta cancelada correctamente'
    });

  } catch (error) {
    console.error('Error cancelando propuesta:', error);
    const statusCode = error.message.includes('permiso') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener libro ganador actual
 * GET /groups/:groupId/proposals/winner
 */
const getWinner = async (req, res) => {
  try {
    const { groupId } = req.params;

    const winner = await proposalsService.getWinner(parseInt(groupId));

    if (!winner) {
      return res.status(404).json({
        success: false,
        message: 'No hay libro ganador todavía'
      });
    }

    return res.status(200).json({
      success: true,
      data: winner,
      message: 'Libro ganador obtenido'
    });

  } catch (error) {
    console.error('Error obteniendo ganador:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getProposals,
  createProposal,
  voteProposal,
  closeProposal,
  cancelProposal,
  getWinner
};
//const prisma = require('../config/database');

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
 * Proponer un libro para el grupo
 * POST /social/groups/:id/books/propose
 * Body: { bookId?, googleBookId?, title, author, coverUrl?, description?, pageCount? }
 */
/*
const proposeBook = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;
    const { 
      bookId, 
      googleBookId, 
      title, 
      author, 
      coverUrl, 
      description, 
      pageCount 
    } = req.body;

    // Validaciones
    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren título y autor del libro'
      });
    }

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para proponer libros'
      });
    }

    // Verificar si ya existe una propuesta OPEN del mismo libro (por título y autor)
    const existingProposal = await prisma.groupBookProposal.findFirst({
      where: {
        groupId,
        title: title.trim(),
        author: author.trim(),
        votingStatus: 'OPEN'
      }
    });

    if (existingProposal) {
      return res.status(400).json({
        success: false,
        message: 'Este libro ya ha sido propuesto en una votación activa'
      });
    }

    // Crear propuesta
    const proposal = await prisma.groupBookProposal.create({
      data: {
        groupId,
        bookId: bookId || null,
        googleBookId: googleBookId || null,
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl || null,
        description: description || null,
        pageCount: pageCount || null,
        proposedByUserId: userId,
        votingStatus: 'OPEN'
      }
    });

    // Auto-votar por el libro que propuso
    await prisma.groupBookVote.create({
      data: {
        proposalId: proposal.id,
        userId
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        ...proposal,
        voteCount: 1
      },
      message: 'Libro propuesto correctamente'
    });

  } catch (error) {
    console.error('Error proponiendo libro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al proponer libro',
      error: error.message
    });
  }
};

/**
 * Obtener propuestas de libros del grupo
 * GET /social/groups/:id/books/proposals?status=OPEN
 */
/*
const getBookProposals = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;
    const { status } = req.query;

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para ver las propuestas'
      });
    }

    // Filtros
    const where = { groupId };
    if (status) {
      where.votingStatus = status;
    }

    // Obtener propuestas con conteo de votos
    const proposals = await prisma.groupBookProposal.findMany({
      where,
      include: {
        votes: {
          select: {
            userId: true,
            votedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatear respuesta con conteo de votos
    const proposalsWithVotes = proposals.map(proposal => ({
      ...proposal,
      voteCount: proposal.votes.length,
      userHasVoted: proposal.votes.some(v => v.userId === userId),
      votes: undefined // Eliminar el array de votos completo
    }));

    return res.status(200).json({
      success: true,
      data: proposalsWithVotes,
      count: proposals.length,
      message: 'Propuestas de libros obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo propuestas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener propuestas de libros',
      error: error.message
    });
  }
};

/**
 * Votar por una propuesta de libro
 * POST /social/groups/:id/books/:proposalId/vote
 */
/*
const voteForProposal = async (req, res) => {
  try {
    const { id: groupId, proposalId } = req.params;
    const userId = req.user.id;

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para votar'
      });
    }

    // Verificar que la propuesta existe y está abierta
    const proposal = await prisma.groupBookProposal.findFirst({
      where: {
        id: proposalId,
        groupId
      }
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    if (proposal.votingStatus !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: 'La votación para esta propuesta está cerrada'
      });
    }

    // Verificar si ya votó
    const existingVote = await prisma.groupBookVote.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
          userId
        }
      }
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'Ya has votado por esta propuesta'
      });
    }

    // Crear voto
    const vote = await prisma.groupBookVote.create({
      data: {
        proposalId,
        userId
      }
    });

    // Obtener conteo actualizado
    const voteCount = await prisma.groupBookVote.count({
      where: { proposalId }
    });

    return res.status(201).json({
      success: true,
      data: {
        vote,
        voteCount
      },
      message: 'Voto registrado correctamente'
    });

  } catch (error) {
    console.error('Error votando:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar voto',
      error: error.message
    });
  }
};

/**
 * Cerrar votación (solo admin)
 * PUT /social/groups/:id/books/:proposalId/close
 */
/*
const closeVoting = async (req, res) => {
  try {
    const { id: groupId, proposalId } = req.params;
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
        message: 'Solo el administrador puede cerrar votaciones'
      });
    }

    // Cerrar todas las propuestas abiertas como 'CLOSED'
    await prisma.groupBookProposal.updateMany({
      where: {
        groupId,
        votingStatus: 'OPEN'
      },
      data: {
        votingStatus: 'CLOSED',
        closedAt: new Date()
      }
    });

    // Marcar la propuesta seleccionada como ganadora
    const winnerProposal = await prisma.groupBookProposal.update({
      where: { id: proposalId },
      data: {
        votingStatus: 'WINNER'
      }
    });

    return res.status(200).json({
      success: true,
      data: winnerProposal,
      message: 'Votación cerrada. Libro ganador seleccionado'
    });

  } catch (error) {
    console.error('Error cerrando votación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar votación',
      error: error.message
    });
  }
};

module.exports = {
  proposeBook,
  getBookProposals,
  voteForProposal,
  closeVoting
};
*/