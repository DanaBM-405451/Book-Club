// src/controllers/groups.controller.js

const groupsService = require('../services/groups.service');

/**
 * Crear un nuevo grupo de lectura
 * POST /groups
 * Body: { name, description?, isPublic?, maxMembers? }
 */
const createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization;

    if (!req.body.name || req.body.name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del grupo es requerido'
      });
    }

    // Solo admins pueden crear grupos con más de 5 miembros
    const data = {
      ...req.body,
      maxMembers: req.user.role === 'ADMIN' && req.body.maxMembers 
        ? req.body.maxMembers 
        : 5
    };

    const group = await groupsService.createGroup(userId, data, token);

    return res.status(201).json({
      success: true,
      data: group,
      message: 'Grupo creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando grupo:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Listar grupos públicos
 * GET /groups?page=1&limit=20
 */
const getPublicGroups = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await groupsService.listPublicGroups(page, limit, token);

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Grupos obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo grupos:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener detalles de un grupo
 * GET /groups/:groupId
 */
const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    const group = await groupsService.getGroupById(parseInt(groupId), userId, token);

    return res.status(200).json({
      success: true,
      data: group,
      message: 'Detalles del grupo obtenidos'
    });

  } catch (error) {
    console.error('Error obteniendo grupo:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 
                       error.message.includes('acceso') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Unirse a un grupo
 * POST /groups/:groupId/join
 */
const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    const member = await groupsService.joinGroup(userId, parseInt(groupId), token);

    return res.status(200).json({
      success: true,
      data: member,
      message: 'Te has unido al grupo exitosamente'
    });

  } catch (error) {
    console.error('Error uniéndose al grupo:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 
                       error.message.includes('lleno') || error.message.includes('Ya eres') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Salir de un grupo
 * DELETE /groups/:groupId/leave
 */
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const result = await groupsService.leaveGroup(userId, parseInt(groupId));

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error saliendo del grupo:', error);
    const statusCode = error.message.includes('no encontrado') || error.message.includes('No eres') ? 404 : 
                       error.message.includes('creador') || error.message.includes('transferir') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener grupos del usuario
 * GET /groups/my-groups
 */
const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization;

    const groups = await groupsService.getUserGroups(userId, token);

    return res.status(200).json({
      success: true,
      data: groups,
      count: groups.length,
      message: 'Grupos del usuario obtenidos'
    });

  } catch (error) {
    console.error('Error obteniendo grupos del usuario:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Actualizar grupo (solo admin)
 * PUT /groups/:groupId
 * Body: { name?, description?, isPublic?, maxMembers? }
 */
const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await groupsService.updateGroup(parseInt(groupId), userId, req.body);

    return res.status(200).json({
      success: true,
      data: group,
      message: 'Grupo actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando grupo:', error);
    const statusCode = error.message.includes('administrador') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Dar permiso para subir libros (solo admin)
 * POST /groups/:groupId/members/:userId/grant-upload
 */
const grantUploadPermission = async (req, res) => {
  try {
    const { groupId, userId: targetUserId } = req.params;
    const adminId = req.user.id;

    const member = await groupsService.grantUploadPermission(
      parseInt(groupId), 
      adminId, 
      targetUserId
    );

    return res.status(200).json({
      success: true,
      data: member,
      message: 'Permiso de subida otorgado correctamente'
    });

  } catch (error) {
    console.error('Error otorgando permiso:', error);
    const statusCode = error.message.includes('administrador') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Revocar permiso para subir libros (solo admin)
 * POST /groups/:groupId/members/:userId/revoke-upload
 */
const revokeUploadPermission = async (req, res) => {
  try {
    const { groupId, userId: targetUserId } = req.params;
    const adminId = req.user.id;

    const member = await groupsService.revokeUploadPermission(
      parseInt(groupId), 
      adminId, 
      targetUserId
    );

    return res.status(200).json({
      success: true,
      data: member,
      message: 'Permiso de subida revocado correctamente'
    });

  } catch (error) {
    console.error('Error revocando permiso:', error);
    const statusCode = error.message.includes('administrador') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener miembros del grupo
 * GET /groups/:groupId/members
 */
const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const token = req.headers.authorization;

    const members = await groupsService.getGroupMembers(parseInt(groupId), token);

    return res.status(200).json({
      success: true,
      data: members,
      message: 'Miembros obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo miembros:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Actualizar rol de un miembro (solo admin)
 * PUT /groups/:groupId/members/:userId/role
 * Body: { role: 'ADMIN' | 'MODERATOR' | 'MEMBER' }
 */
const updateMemberRole = async (req, res) => {
  try {
    const { groupId, userId: targetUserId } = req.params;
    const adminId = req.user.id;
    const { role } = req.body;

    const member = await groupsService.updateMemberRole(
      parseInt(groupId),
      adminId,
      parseInt(targetUserId),
      role
    );

    return res.status(200).json({
      success: true,
      data: member,
      message: 'Rol actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando rol:', error);
    const statusCode = error.message.includes('administrador') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Actualizar permisos de un miembro (solo admin)
 * PUT /groups/:groupId/members/:userId/permissions
 * Body: { canUploadBooks: boolean }
 */
const updateMemberPermissions = async (req, res) => {
  try {
    const { groupId, userId: targetUserId } = req.params;
    const adminId = req.user.id;
    const { canUploadBooks } = req.body;

    const member = await groupsService.updateMemberPermissions(
      parseInt(groupId),
      adminId,
      parseInt(targetUserId),
      canUploadBooks
    );

    return res.status(200).json({
      success: true,
      data: member,
      message: 'Permisos actualizados correctamente'
    });

  } catch (error) {
    console.error('Error actualizando permisos:', error);
    const statusCode = error.message.includes('administrador') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Remover un miembro del grupo (solo admin)
 * DELETE /groups/:groupId/members/:userId
 */
const removeMember = async (req, res) => {
  try {
    const { groupId, userId: targetUserId } = req.params;
    const adminId = req.user.id;

    await groupsService.removeMember(
      parseInt(groupId),
      adminId,
      parseInt(targetUserId)
    );

    return res.status(200).json({
      success: true,
      message: 'Miembro expulsado del grupo'
    });

  } catch (error) {
    console.error('Error expulsando miembro:', error);
    const statusCode = error.message.includes('administrador') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/*const getAdminStats = async (req, res) => {
  try {
    // ✅ Llamamos al servicio, NO a prisma
    const stats = await groupsService.getGlobalStats(); 

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en stats' });
  }
};*/

const getAdminStats = async (req, res) => {
  try {
    // 1. Extraer filtros de la URL (frontend envía ?startDate=...&endDate=...)
    const { startDate, endDate } = req.query;

    // 2. Pasarlos al servicio para que filtre
    const stats = await groupsService.getGlobalStats({ startDate, endDate });

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en stats' });
  }
};


module.exports = {
  createGroup,
  getPublicGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getMyGroups,
  updateGroup,
  grantUploadPermission,
  revokeUploadPermission,
  getGroupMembers,
  updateMemberRole,
  updateMemberPermissions,
  removeMember,
  getAdminStats
};
//const prisma = require('../config/database');

/**
 * Crear un nuevo grupo de lectura
 * POST /social/groups
 * Body: { name, description, isPublic, maxMembers }
 */
/*
const createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, isPublic, maxMembers } = req.body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del grupo es requerido'
      });
    }

    // Solo admins pueden crear grupos con más de 5 miembros
    const finalMaxMembers = req.user.role === 'ADMIN' && maxMembers 
      ? maxMembers 
      : 5;

    // Crear grupo
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdByUserId: userId,
        isPublic: isPublic !== false, // Por defecto true
        maxMembers: finalMaxMembers,
        currentMembers: 1 // El creador
      }
    });

    // Agregar al creador como miembro ADMIN del grupo
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: 'ADMIN'
      }
    });

    return res.status(201).json({
      success: true,
      data: group,
      message: 'Grupo creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando grupo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear grupo',
      error: error.message
    });
  }
};

/**
 * Listar grupos públicos
 * GET /social/groups?page=1&limit=10
 */
/*
const getPublicGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where: {
          isPublic: true
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          _count: {
            select: {
              members: true,
              posts: true
            }
          }
        }
      }),
      prisma.group.count({
        where: {
          isPublic: true
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      message: 'Grupos obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo grupos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener grupos',
      error: error.message
    });
  }
};

/**
 * Obtener detalles de un grupo
 * GET /social/groups/:id
 */
/*
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true
          }
        },
        _count: {
          select: {
            posts: true,
            goals: true,
            bookProposals: true
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    // Verificar si el grupo es privado y el usuario no es miembro
    const isMember = group.members.some(m => m.userId === userId);
    
    if (!group.isPublic && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este grupo'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...group,
        isMember,
        userRole: isMember 
          ? group.members.find(m => m.userId === userId).role 
          : null
      },
      message: 'Detalles del grupo obtenidos'
    });

  } catch (error) {
    console.error('Error obteniendo grupo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener detalles del grupo',
      error: error.message
    });
  }
};

/**
 * Unirse a un grupo
 * POST /social/groups/:id/join
 */
/*
const joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Obtener grupo
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: true
      }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    // Verificar si ya es miembro
    const isMember = group.members.some(m => m.userId === userId);
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'Ya eres miembro de este grupo'
      });
    }

    // Verificar cupo disponible
    if (group.currentMembers >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'El grupo ha alcanzado el máximo de miembros'
      });
    }

    // Agregar miembro
    const member = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId,
        role: 'MEMBER'
      }
    });

    // Actualizar contador de miembros
    await prisma.group.update({
      where: { id },
      data: {
        currentMembers: {
          increment: 1
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: member,
      message: 'Te has unido al grupo exitosamente'
    });

  } catch (error) {
    console.error('Error uniéndose al grupo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al unirse al grupo',
      error: error.message
    });
  }
};

/**
 * Salir de un grupo
 * DELETE /social/groups/:id/leave
 */
/*
const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Buscar membresía
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId
        }
      }
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'No eres miembro de este grupo'
      });
    }

    // Verificar si es admin y el único admin
    if (membership.role === 'ADMIN') {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId: id,
          role: 'ADMIN'
        }
      });

      if (adminCount === 1) {
        return res.status(400).json({
          success: false,
          message: 'No puedes salir del grupo siendo el único administrador. Transfiere el rol primero.'
        });
      }
    }

    // Eliminar membresía
    await prisma.groupMember.delete({
      where: {
        id: membership.id
      }
    });

    // Actualizar contador
    await prisma.group.update({
      where: { id },
      data: {
        currentMembers: {
          decrement: 1
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Has salido del grupo correctamente'
    });

  } catch (error) {
    console.error('Error saliendo del grupo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al salir del grupo',
      error: error.message
    });
  }
};

/**
 * Obtener grupos del usuario
 * GET /social/groups/my-groups
 */
/*
const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const memberships = await prisma.groupMember.findMany({
      where: {
        userId
      },
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: true,
                posts: true
              }
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    const groups = memberships.map(m => ({
      ...m.group,
      userRole: m.role,
      joinedAt: m.joinedAt
    }));

    return res.status(200).json({
      success: true,
      data: groups,
      count: groups.length,
      message: 'Grupos del usuario obtenidos'
    });

  } catch (error) {
    console.error('Error obteniendo grupos del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener tus grupos',
      error: error.message
    });
  }
};

module.exports = {
  createGroup,
  getPublicGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getMyGroups
};
*/