// social-service/src/services/groups.service.js

const { prisma } = require('../config/database');
const externalService = require('./external.service');
const { createPaginatedResponse, createNotificationMetadata } = require('../utils/helpers');

class GroupsService {
  /**
   * Crear un grupo de lectura
   * Historia 5.3: Grupos de lectura
   */
  async createGroup(userId, data, token) {
  try {
    const { name, description, maxMembers = 5, isPublic = true } = data;

    // ✅ Crear el grupo CON el primer miembro en una sola transacción
    const group = await prisma.group.create({
      data: {
        name,
        description,
        maxMembers,
        isPublic,
        createdBy: userId,
        // ✅ Crear el primer miembro (admin) usando la relación
        members: {
          create: {
            userId: userId,
            role: 'ADMIN',
            canUploadBooks: true,
          }
        }
      },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      }
    });

      // Otorgar puntos XP por crear un grupo
      await externalService.awardXP(
        userId,
        25,
        'Crear un grupo de lectura',
        token
      );

      return group;
    } catch (error) {
      console.error('Error creando grupo:', error);
      throw new Error('No se pudo crear el grupo');
    }
  }

  /**
   * Listar grupos públicos
   * Historia 5.3: Grupos de lectura
   */
  async listPublicGroups(page = 1, limit = 20, token) {
    try {
      const skip = (page - 1) * limit;

      const [groups, total] = await Promise.all([
        prisma.group.findMany({
          where: { isPublic: true },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            _count: {
              select: {
                members: true,
                posts: true,
              },
            },
          },
        }),
        prisma.group.count({
          where: { isPublic: true },
        }),
      ]);

      // Obtener información de los creadores
      const creatorIds = [...new Set(groups.map(g => g.createdBy))];
      const creators = await externalService.getUserProfiles(creatorIds, token);
      const creatorMap = new Map(creators.map(c => [c.userId, c]));

      // Mapear grupos con información adicional
      const groupsWithInfo = groups.map(group => ({
        ...group,
        creator: creatorMap.get(group.createdBy) || null,
        membersCount: group._count.members,
        postsCount: group._count.posts,
        isFull: group._count.members >= group.maxMembers, 
      }));

      return createPaginatedResponse(groupsWithInfo, page, limit, total);
    } catch (error) {
      console.error('Error listando grupos públicos:', error);
      throw new Error('No se pudieron listar los grupos');
    }
  }

  /**
   * Obtener detalle de un grupo
   * Historia 5.3: Grupos de lectura
   */
  async getGroupById(groupId, userId, token) {
    try {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: true,
          _count: {
            select: {
              posts: true,
              goals: true,
              bookProposals: true,
              members: true, // Aseguramos el conteo
            },
          },
        },
      });

      if (!group) {
        throw new Error('Grupo no encontrado');
      }

      // ❌ BLOQUE ELIMINADO: Permitimos ver la info básica aunque sea privado
      /* if (!group.isPublic) {
        const isMember = group.members.some(m => m.userId === userId);
        if (!isMember) {
          throw new Error('No tienes acceso a este grupo privado');
        }
      }
      */

      // --- Enriquecimiento de datos (Tu lógica original) ---

      // Obtener perfiles de los miembros
      const memberIds = group.members.map(m => m.userId);
      let profileMap = new Map();
      
      try {
          const profiles = await externalService.getUserProfiles(memberIds, token);
          profileMap = new Map(profiles.map(p => [p.userId, p]));
      } catch (e) { console.log("No se pudieron cargar perfiles externos"); }

      // Mapear miembros con sus perfiles
      const membersWithProfiles = group.members.map(member => ({
        ...member,
        profile: profileMap.get(member.userId) || null,
      }));

      // Obtener perfil del creador
      let creator = null;
      try {
        creator = await externalService.getUserProfile(group.createdBy, token);
      } catch (e) {}

      // Verificar si el usuario actual es miembro
      const userMembership = group.members.find(m => m.userId === userId);

      return {
        ...group,
        creator,
        members: membersWithProfiles,
        membersCount: group._count.members,
        postsCount: group._count.posts,
        goalsCount: group._count.goals,
        proposalsCount: group._count.bookProposals,
        isFull: group._count.members >= group.maxMembers,
        userMembership: userMembership || null, // 👈 Vital para el frontend
      };

    } catch (error) {
      console.error('Error obteniendo grupo:', error);
      throw error;
    }
  }
  /**
   * Unirse a un grupo
   */
  async joinGroup(userId, groupId, token) {
    try {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          _count: { select: { members: true } },
          members: true,
        },
      });

      if (!group) throw new Error('Grupo no encontrado');

      if (group._count.members >= group.maxMembers) {
        throw new Error('El grupo está lleno');
      }

      const alreadyMember = group.members.some(m => m.userId === userId);
      if (alreadyMember) throw new Error('Ya eres miembro de este grupo');

      // Agregar como miembro
      const member = await prisma.groupMember.create({
        data: {
          groupId,
          userId,
          role: 'MEMBER',
        },
      });

      // ✅ CORRECCIÓN AQUÍ: Usar group.createdBy como destinatario
      await this.createNotification(
        group.createdBy, // Destinatario (Admin del grupo)
        userId,          // Remitente (Quien se une)
        'GROUP_ACTIVITY', // Enum válido
        'Nuevo miembro',
        `Un nuevo usuario se unió a ${group.name}`,
        { groupId: group.id, groupName: group.name }
      );

      // Otorgar XP
      await externalService.awardXP(userId, 10, 'Unirse a un grupo', token);

      return member;
    } catch (error) {
      console.error('Error uniéndose al grupo:', error);
      throw error;
    }
  }

  /**
   * Actualizar configuración del grupo (solo admin)
   */
  /**
   * Actualizar configuración del grupo (solo admin)
   * ✅ MEJORADO: Valida que el cupo no sea menor a los miembros actuales
   */
  async updateGroup(groupId, userId, data) {
    try {
      // 1. Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership || membership.role !== 'ADMIN') {
        const error = new Error('Solo el administrador puede actualizar el grupo');
        error.statusCode = 403; // Agregamos status para que el controlador lo use si quiere
        throw error;
      }

      // 2. ✅ VALIDACIÓN NUEVA: Si se cambia el cupo, verificar que no rompa la lógica actual
      if (data.maxMembers) {
          const currentCount = await prisma.groupMember.count({ where: { groupId } });
          if (data.maxMembers < currentCount) {
              const error = new Error(`No puedes reducir el cupo a ${data.maxMembers} porque ya hay ${currentCount} miembros activos.`);
              error.statusCode = 400;
              throw error;
          }
      }

      // 3. Actualizar el grupo
      return await prisma.group.update({
        where: { id: groupId },
        data: {
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          maxMembers: data.maxMembers,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error actualizando grupo:', error);
      throw error; // Re-lanzamos para que el controlador lo capture
    }
  }

  /**
   * Remover un miembro del grupo
   * ✅ MEJORADO: Evita auto-expulsión y valida existencia
   */
  async removeMember(groupId, adminId, targetUserId) {
    try {
      // 1. Verificar que quien hace la acción es admin
      const adminMembership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId: adminId }
        }
      });

      if (!adminMembership || adminMembership.role !== 'ADMIN') {
        const error = new Error('Solo el administrador puede expulsar miembros');
        error.statusCode = 403;
        throw error;
      }

      // 2. ✅ VALIDACIÓN NUEVA: Evitar auto-expulsión
      // Los IDs pueden venir como string o number dependiendo de la base de datos, 
      // usamos '==' para comparación laxa o String() para estar seguros.
      if (String(adminId) === String(targetUserId)) {
          const error = new Error('No puedes expulsarte a ti mismo. Usa la opción "Salir del grupo".');
          error.statusCode = 400;
          throw error;
      }

      // 3. Validar que el usuario objetivo realmente existe en el grupo
      const targetMember = await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId, userId: targetUserId } }
      });

      if (!targetMember) {
          const error = new Error('El usuario no es miembro de este grupo');
          error.statusCode = 404;
          throw error;
      }

      // 4. No se puede expulsar al creador del grupo (Protección original manténida)
      const group = await prisma.group.findUnique({
        where: { id: groupId }
      });

      if (group.createdBy === targetUserId) {
        throw new Error('No se puede expulsar al creador del grupo');
      }

      // 5. Remover miembro
      await prisma.groupMember.delete({
        where: {
          groupId_userId: { groupId, userId: targetUserId }
        }
      });

      return { message: 'Miembro expulsado correctamente' };

    } catch (error) {
      console.error('Error expulsando miembro:', error);
      throw error;
    }
  }

  /**
   * Obtener grupos del usuario
   */
  async getUserGroups(userId, token) {
    try {
      const memberships = await prisma.groupMember.findMany({
        where: { userId },
        include: {
          group: {
            include: {
              _count: {
                select: {
                  members: true,
                  posts: true,
                },
              },
            },
          },
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });

      return memberships.map(m => ({
        membership: {
          role: m.role,
          joinedAt: m.joinedAt,
          canUploadBooks: m.canUploadBooks,
        },
        group: {
          ...m.group,
          membersCount: m.group._count.members,
          postsCount: m.group._count.posts,
        },
      }));
    } catch (error) {
      console.error('Error obteniendo grupos del usuario:', error);
      throw new Error('No se pudieron obtener los grupos del usuario');
    }
  }

  /**
   * Dar permiso para subir libros a un miembro (solo admin)
   */
  async grantUploadPermission(groupId, adminId, userId) {
    try {
      // Verificar que quien hace la acción es admin
      const adminMembership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: adminId,
          },
        },
      });

      if (!adminMembership || adminMembership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede otorgar permisos');
      }

      // Actualizar permisos del miembro
      return await prisma.groupMember.update({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
        data: {
          canUploadBooks: true,
        },
      });
    } catch (error) {
      console.error('Error otorgando permiso de subida:', error);
      throw error;
    }
  }

  /**
   * Crear notificación
   */
  async createNotification(userId,senderId, type, title, message, metadata = {}) {
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

  /**
 * Obtener miembros del grupo
 */
async getGroupMembers(groupId, token) {
  try {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' }
      ],
    });

    // Obtener perfiles de usuarios
    const userIds = members.map(m => m.userId);
    const profiles = await externalService.getUserProfiles(userIds, token);
    const profileMap = new Map(profiles.map(p => [p.userId, p]));

    return members.map(member => ({
      ...member,
      username: profileMap.get(member.userId)?.username || 'Usuario',
      email: profileMap.get(member.userId)?.email || null,
    }));

  } catch (error) {
    console.error('Error obteniendo miembros:', error);
    throw new Error('No se pudieron obtener los miembros');
  }
}

/**
 * Actualizar rol de un miembro
 */
async updateMemberRole(groupId, adminId, targetUserId, newRole) {
  try {
    // Verificar que quien hace la acción es admin
    const adminMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: adminId }
      }
    });

    if (!adminMembership || adminMembership.role !== 'ADMIN') {
      throw new Error('Solo el administrador puede cambiar roles');
    }

    // Actualizar rol
    return await prisma.groupMember.update({
      where: {
        groupId_userId: { groupId, userId: targetUserId }
      },
      data: { role: newRole }
    });

  } catch (error) {
    console.error('Error actualizando rol:', error);
    throw error;
  }
}

/**
 * Actualizar permisos de un miembro
 */
async updateMemberPermissions(groupId, adminId, targetUserId, canUploadBooks) {
  try {
    // Verificar que quien hace la acción es admin
    const adminMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: adminId }
      }
    });

    if (!adminMembership || adminMembership.role !== 'ADMIN') {
      throw new Error('Solo el administrador puede cambiar permisos');
    }

    // Actualizar permisos
    return await prisma.groupMember.update({
      where: {
        groupId_userId: { groupId, userId: targetUserId }
      },
      data: { canUploadBooks }
    });

  } catch (error) {
    console.error('Error actualizando permisos:', error);
    throw error;
  }
}

/**
 * Remover un miembro del grupo
 */
async removeMember(groupId, adminId, targetUserId) {
  try {
    // Verificar que quien hace la acción es admin
    const adminMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: adminId }
      }
    });

    if (!adminMembership || adminMembership.role !== 'ADMIN') {
      throw new Error('Solo el administrador puede expulsar miembros');
    }

    // No se puede expulsar al creador del grupo
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (group.createdBy === targetUserId) {
      throw new Error('No se puede expulsar al creador del grupo');
    }

    // Remover miembro
    await prisma.groupMember.delete({
      where: {
        groupId_userId: { groupId, userId: targetUserId }
      }
    });

    return { message: 'Miembro expulsado correctamente' };

  } catch (error) {
    console.error('Error expulsando miembro:', error);
    throw error;
  }
}

// ... dentro de GroupsService
  /*async getGlobalStats({ startDate, endDate } = {}) {
    const whereClause = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (!isNaN(start.getTime())) {
        whereClause.createdAt = { gte: start, lte: end };
      }
    }

    const totalGroups = await prisma.group.count({ where: whereClause });

    const latestGroups = await prisma.group.findMany({
      take: 5,
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: { name: true, createdAt: true }
    });

    return { totalGroups, latestGroups };
  }*/

    // ... dentro de la clase GroupsService

    async getGlobalStats({ startDate, endDate } = {}) {
    // Construimos el filtro dinámicamente
    const whereClause = {};

    // Si hay fechas, filtramos por createdAt
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Incluir todo el último día

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        whereClause.createdAt = {
          gte: start,
          lte: end
        };
      }
    }

    // 1. Total Grupos (Filtrados por fecha si aplica)
    const totalGroups = await prisma.group.count({ where: whereClause });

    // 2. Últimos grupos creados (Filtrados)
    const latestGroups = await prisma.group.findMany({
      take: 5,
      where: whereClause, // ✅ Aplicamos el filtro aquí también
      orderBy: { createdAt: 'desc' },
      select: { name: true, createdAt: true }
    });

    return { totalGroups, latestGroups };
  }
}

module.exports = new GroupsService();