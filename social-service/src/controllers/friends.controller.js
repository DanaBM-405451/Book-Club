// src/controllers/friends.controller.js

const friendsService = require('../services/friends.service');

/**
 * Enviar solicitud de amistad
 * POST /friends/request
 * Body: { friendId: "uuid" }
 */
const sendFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;
    const token = req.headers.authorization;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID del destinatario (friendId)'
      });
    }

    const friendship = await friendsService.sendFriendRequest(userId, friendId, token);

    return res.status(201).json({
      success: true,
      data: friendship,
      message: 'Solicitud de amistad enviada'
    });

  } catch (error) {
    console.error('Error enviando solicitud de amistad:', error);
    return res.status(error.message.includes('No puedes') || error.message.includes('Ya') ? 400 : 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener solicitudes de amistad recibidas
 * GET /friends/requests
 */
const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization;

    const requests = await friendsService.getFriendRequests(userId, token);

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length,
      message: 'Solicitudes de amistad obtenidas'
    });

  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Aceptar solicitud de amistad
 * POST /friends/:friendshipId/accept
 */
/*
const acceptFriendRequest = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    const friendship = await friendsService.acceptFriendRequest(userId, friendshipId, token);

    return res.status(200).json({
      success: true,
      data: friendship,
      message: 'Solicitud de amistad aceptada'
    });

  } catch (error) {
    console.error('Error aceptando solicitud:', error);
    const statusCode = error.message.includes('no encontrada') ? 404 : 
                       error.message.includes('permiso') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};*/

/**
 * Rechazar solicitud de amistad
 * POST /friends/:friendshipId/reject
 */
/*
const rejectFriendRequest = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.id;

    await friendsService.rejectFriendRequest(userId, friendshipId);

    return res.status(200).json({
      success: true,
      message: 'Solicitud de amistad rechazada'
    });

  } catch (error) {
    console.error('Error rechazando solicitud:', error);
    const statusCode = error.message.includes('no encontrada') ? 404 : 
                       error.message.includes('permiso') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};
*/
/**
 * Obtener lista de amigos
 * GET /friends
 */
const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization;

    const friends = await friendsService.getFriends(userId, token);

    return res.status(200).json({
      success: true,
      data: friends,
      count: friends.length,
      message: 'Lista de amigos obtenida'
    });

  } catch (error) {
    console.error('Error obteniendo amigos:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Eliminar amistad
 * DELETE /friends/:friendshipId
 */
/*
const removeFriend = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.id;

    const result = await friendsService.removeFriend(userId, friendshipId);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error eliminando amistad:', error);
    const statusCode = error.message.includes('no encontrada') ? 404 : 
                       error.message.includes('permiso') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};*/

/**
 * Aceptar solicitud de amistad
 * POST /friends/:friendshipId/accept
 */
const acceptFriendRequest = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    // ✅ Convertir a número
    const numericFriendshipId = parseInt(friendshipId, 10);
    
    if (isNaN(numericFriendshipId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de solicitud inválido'
      });
    }

    const friendship = await friendsService.acceptFriendRequest(userId, numericFriendshipId, token);

    return res.status(200).json({
      success: true,
      data: friendship,
      message: 'Solicitud de amistad aceptada'
    });

  } catch (error) {
    console.error('Error aceptando solicitud:', error);
    const statusCode = error.message.includes('no encontrada') ? 404 :
                       error.message.includes('permiso') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Rechazar solicitud de amistad
 * POST /friends/:friendshipId/reject
 */
const rejectFriendRequest = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.id;

    // ✅ Convertir a número
    const numericFriendshipId = parseInt(friendshipId, 10);
    
    if (isNaN(numericFriendshipId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de solicitud inválido'
      });
    }

    await friendsService.rejectFriendRequest(userId, numericFriendshipId);

    return res.status(200).json({
      success: true,
      message: 'Solicitud de amistad rechazada'
    });

  } catch (error) {
    console.error('Error rechazando solicitud:', error);
    const statusCode = error.message.includes('no encontrada') ? 404 :
                       error.message.includes('permiso') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Eliminar amistad
 * DELETE /friends/:friendshipId
 */
const removeFriend = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.id;

    // ✅ Convertir a número
    const numericFriendshipId = parseInt(friendshipId, 10);
    
    if (isNaN(numericFriendshipId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de amistad inválido'
      });
    }

    const result = await friendsService.removeFriend(userId, numericFriendshipId);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error eliminando amistad:', error);
    const statusCode = error.message.includes('no encontrada') ? 404 :
                       error.message.includes('permiso') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend
};
  
/*
const prisma = require('../config/database');
const { getUserProfile } = require('../utils/apiClient');

/**
 * Enviar solicitud de amistad
 * POST /social/friends/request
 * Body: { addresseeId: "uuid" }
 */
/*
const sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id; // Del JWT
    const { addresseeId } = req.body;

    // Validaciones
    if (!addresseeId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID del destinatario'
      });
    }

    if (requesterId === addresseeId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes enviarte una solicitud a ti mismo'
      });
    }

    // Verificar si ya existe una solicitud en cualquier dirección
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId }
        ]
      }
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'ACCEPTED') {
        return res.status(400).json({
          success: false,
          message: 'Ya son amigos'
        });
      }
      if (existingFriendship.status === 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una solicitud pendiente'
        });
      }
      if (existingFriendship.status === 'BLOCKED') {
        return res.status(400).json({
          success: false,
          message: 'No se puede enviar solicitud'
        });
      }
    }

    // Crear solicitud de amistad
    const friendship = await prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: 'PENDING'
      }
    });

    return res.status(201).json({
      success: true,
      data: friendship,
      message: 'Solicitud de amistad enviada'
    });

  } catch (error) {
    console.error('Error enviando solicitud de amistad:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al enviar solicitud de amistad',
      error: error.message
    });
  }
};

/**
 * Obtener solicitudes de amistad recibidas
 * GET /social/friends/requests
 */
/*
const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // TODO: Enriquecer con información de user-service
    // Por ahora solo devolvemos los IDs

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length,
      message: 'Solicitudes de amistad obtenidas'
    });

  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes',
      error: error.message
    });
  }
};

/**
 * Aceptar solicitud de amistad
 * PUT /social/friends/accept/:id
 */
/*
const acceptFriendRequest = async (req, res) => {
  try {
    const { id } = req.params; // ID de la solicitud (Friendship)
    const userId = req.user.id;

    // Buscar solicitud
    const friendship = await prisma.friendship.findUnique({
      where: { id }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Verificar que es el destinatario
    if (friendship.addresseeId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para aceptar esta solicitud'
      });
    }

    // Verificar que está pendiente
    if (friendship.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'La solicitud no está pendiente'
      });
    }

    // Aceptar solicitud
    const updatedFriendship = await prisma.friendship.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedFriendship,
      message: 'Solicitud de amistad aceptada'
    });

  } catch (error) {
    console.error('Error aceptando solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al aceptar solicitud',
      error: error.message
    });
  }
};

/**
 * Rechazar solicitud de amistad
 * DELETE /social/friends/reject/:id
 */
/*
const rejectFriendRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Buscar solicitud
    const friendship = await prisma.friendship.findUnique({
      where: { id }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Verificar que es el destinatario
    if (friendship.addresseeId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para rechazar esta solicitud'
      });
    }

    // Eliminar solicitud
    await prisma.friendship.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Solicitud de amistad rechazada'
    });

  } catch (error) {
    console.error('Error rechazando solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al rechazar solicitud',
      error: error.message
    });
  }
};

/**
 * Obtener lista de amigos
 * GET /social/friends
 */
/*
const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar amistades aceptadas donde el usuario es requester o addressee
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId },
          { addresseeId: userId }
        ]
      },
      orderBy: {
        acceptedAt: 'desc'
      }
    });

    // Extraer IDs de amigos
    const friendIds = friendships.map(f => 
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    return res.status(200).json({
      success: true,
      data: friendships,
      friendIds,
      count: friendships.length,
      message: 'Lista de amigos obtenida'
    });

  } catch (error) {
    console.error('Error obteniendo amigos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener lista de amigos',
      error: error.message
    });
  }
};

/**
 * Eliminar amistad
 * DELETE /social/friends/:id
 */
/*
const removeFriend = async (req, res) => {
  try {
    const { id } = req.params; // ID de la amistad (Friendship)
    const userId = req.user.id;

    // Buscar amistad
    const friendship = await prisma.friendship.findUnique({
      where: { id }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Amistad no encontrada'
      });
    }

    // Verificar que el usuario es parte de la amistad
    if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta amistad'
      });
    }

    // Eliminar amistad
    await prisma.friendship.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Amistad eliminada correctamente'
    });

  } catch (error) {
    console.error('Error eliminando amistad:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar amistad',
      error: error.message
    });
  }
};

module.exports = {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend
};
*/