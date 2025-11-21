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
            },
          },
        },
      });

      if (!group) {
        throw new Error('Grupo no encontrado');
      }

      // Verificar si el grupo es privado y el usuario no es miembro
      if (!group.isPublic) {
        const isMember = group.members.some(m => m.userId === userId);
        if (!isMember) {
          throw new Error('No tienes acceso a este grupo privado');
        }
      }

      // Obtener perfiles de los miembros
      const memberIds = group.members.map(m => m.userId);
      const profiles = await externalService.getUserProfiles(memberIds, token);
      const profileMap = new Map(profiles.map(p => [p.userId, p]));

      // Mapear miembros con sus perfiles
      const membersWithProfiles = group.members.map(member => ({
        ...member,
        profile: profileMap.get(member.userId) || null,
      }));

      // Obtener perfil del creador
      const creator = await externalService.getUserProfile(group.createdBy, token);

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
        userMembership: userMembership || null,
      };
    } catch (error) {
      console.error('Error obteniendo grupo:', error);
      throw error;
    }
  }

  /**
   * Unirse a un grupo
   * Historia 5.3: Grupos de lectura
   */
  async joinGroup(userId, groupId, token) {
    try {
     const group = await prisma.group.findUnique({
  where: { id: groupId },
  include: {
    _count: {
      select: {
        members: true
      }
    },
    members: true,
  },
});

      if (!group) {
        throw new Error('Grupo no encontrado');
      }

      // Verificar si el grupo está lleno
     if (group._count.members >= group.maxMembers) {
  throw new Error('El grupo está lleno');
}

      // Verificar si ya es miembro
      const alreadyMember = group.members.some(m => m.userId === userId);
      if (alreadyMember) {
        throw new Error('Ya eres miembro de este grupo');
      }

      // Agregar como miembro
      const member = await prisma.groupMember.create({
        data: {
          groupId,
          userId,
          role: 'MEMBER',
        },
      });

     /* // Actualizar contador de miembros
      await prisma.group.update({
        where: { id: groupId },
        data: {
          currentMembers: {
            increment: 1,
          },
        },
      });*/

      // Notificar al admin del grupo
      await this.createNotification(
        group.createdBy,
        'GROUP_JOIN',
        'Nuevo miembro en tu grupo',
        `Un nuevo usuario se unió a ${group.name}`,
        { groupId, userId }
      );

      // Otorgar puntos XP
      await externalService.awardXP(
        userId,
        10,
        'Unirse a un grupo de lectura',
        token
      );

      return member;
    } catch (error) {
      console.error('Error uniéndose al grupo:', error);
      throw error;
    }
  }

  /**
   * Salir de un grupo
   * Historia 5.3: Grupos de lectura
   */
  async leaveGroup(userId, groupId) {
    try {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        throw new Error('Grupo no encontrado');
      }

      // Verificar si es miembro
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('No eres miembro de este grupo');
      }

      // El creador no puede salir del grupo
      if (group.createdBy === userId) {
        throw new Error('El creador del grupo no puede salir. Debes eliminar el grupo o transferir la administración.');
      }

      // Eliminar membresía
      await prisma.groupMember.delete({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      // Actualizar contador de miembros
      await prisma.group.update({
        where: { id: groupId },
        data: {
          currentMembers: {
            decrement: 1,
          },
        },
      });

      return { message: 'Has salido del grupo exitosamente' };
    } catch (error) {
      console.error('Error saliendo del grupo:', error);
      throw error;
    }
  }

  /**
   * Actualizar configuración del grupo (solo admin)
   */
  async updateGroup(groupId, userId, data) {
    try {
      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede actualizar el grupo');
      }

      // Actualizar el grupo
      return await prisma.group.update({
        where: { id: groupId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error actualizando grupo:', error);
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
}

module.exports = new GroupsService();