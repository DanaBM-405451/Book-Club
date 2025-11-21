// social-service/src/services/friends.service.js

const { prisma } = require('../config/database');
const externalService = require('./external.service');
const { createNotificationMetadata } = require('../utils/helpers');

class FriendsService {
  /**
   * Enviar solicitud de amistad
   * Historia 5.2: Sistema de amistad
   */
  async sendFriendRequest(userId, friendId, token) {
    try {
      // Validar que no intente enviarse solicitud a sí mismo
      if (userId === friendId) {
        throw new Error('No puedes enviarte una solicitud de amistad a ti mismo');
      }

      // Verificar que el usuario destino existe
      await externalService.getUserProfile(friendId, token);

      // Verificar si ya existe una solicitud o amistad
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      });

      if (existing) {
        if (existing.status === 'ACCEPTED') {
          throw new Error('Ya son amigos');
        }
        if (existing.status === 'PENDING') {
          throw new Error('Ya existe una solicitud pendiente');
        }
        if (existing.status === 'REJECTED') {
          // Permitir reenviar después de rechazo
          const friendship = await prisma.friendship.update({
            where: { id: existing.id },
            data: {
              status: 'PENDING',
              requestedAt: new Date(),
            },
          });

          // Crear notificación
          await this.createNotification(
            friendId,
            userId, // ✅ senderId
            'FRIEND_REQUEST',
            'Nueva solicitud de amistad',
            `Tienes una nueva solicitud de amistad`,
            { fromUserId: userId, friendshipId: friendship.id }
          );

          return friendship;
        }
      }

      // Crear nueva solicitud
      const friendship = await prisma.friendship.create({
        data: {
          userId,
          friendId,
          status: 'PENDING',
        },
      });

      // Crear notificación
      await this.createNotification(
        friendId,
        userId, // ✅ senderId
        'FRIEND_REQUEST',
        'Nueva solicitud de amistad',
        `Tienes una nueva solicitud de amistad`,
        { fromUserId: userId, friendshipId: friendship.id }
      );

      return friendship;
    } catch (error) {
      console.error('Error enviando solicitud de amistad:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes de amistad recibidas
   * Historia 5.2: Sistema de amistad
   */
  async getFriendRequests(userId, token) {
    try {
      const requests = await prisma.friendship.findMany({
        where: {
          friendId: userId,
          status: 'PENDING',
        },
        orderBy: {
          requestedAt: 'desc',
        },
      });

      // Obtener información de los usuarios que enviaron las solicitudes
      const userIds = requests.map(r => r.userId);
      
      if (userIds.length === 0) {
        return [];
      }

      const profiles = await externalService.getUserProfiles(userIds, token);

      // Mapear perfiles con solicitudes
      const profileMap = new Map(profiles.map(p => [p.userId, p]));

      return requests.map(request => ({
        ...request,
        user: profileMap.get(request.userId) || null,
      }));
    } catch (error) {
      console.error('Error obteniendo solicitudes de amistad:', error);
      throw new Error('No se pudieron obtener las solicitudes de amistad');
    }
  }

  /**
   * Aceptar solicitud de amistad
   * Historia 5.2: Sistema de amistad
   */
  async acceptFriendRequest(userId, friendshipId, token) {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });

      if (!friendship) {
        throw new Error('Solicitud de amistad no encontrada');
      }

      // Verificar que el usuario es el receptor de la solicitud
      if (friendship.friendId !== userId) {
        throw new Error('No tienes permiso para aceptar esta solicitud');
      }

      if (friendship.status !== 'PENDING') {
        throw new Error('Esta solicitud ya fue procesada');
      }

      // Aceptar la solicitud
      const accepted = await prisma.friendship.update({
        where: { id: friendshipId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // Crear notificación para el usuario que envió la solicitud
      await this.createNotification(
        friendship.userId,
        userId, // ✅ senderId
        'FRIEND_ACCEPTED',
        'Solicitud aceptada',
        `Tu solicitud de amistad fue aceptada`,
        { byUserId: userId, friendshipId: accepted.id }
      );

      // Otorgar puntos XP por hacer un amigo
      await externalService.awardXP(
        userId,
        10,
        'Aceptar solicitud de amistad',
        token
      );

      await externalService.awardXP(
        friendship.userId,
        10,
        'Solicitud de amistad aceptada',
        token
      );

      return accepted;
    } catch (error) {
      console.error('Error aceptando solicitud de amistad:', error);
      throw error;
    }
  }

  /**
   * Rechazar solicitud de amistad
   * Historia 5.2: Sistema de amistad
   */
  async rejectFriendRequest(userId, friendshipId) {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });

      if (!friendship) {
        throw new Error('Solicitud de amistad no encontrada');
      }

      // Verificar que el usuario es el receptor de la solicitud
      if (friendship.friendId !== userId) {
        throw new Error('No tienes permiso para rechazar esta solicitud');
      }

      if (friendship.status !== 'PENDING') {
        throw new Error('Esta solicitud ya fue procesada');
      }

      // Rechazar la solicitud
      return await prisma.friendship.update({
        where: { id: friendshipId },
        data: {
          status: 'REJECTED',
          // ❌ rejectedAt NO EXISTE en el schema
        },
      });
    } catch (error) {
      console.error('Error rechazando solicitud de amistad:', error);
      throw error;
    }
  }

  /**
   * Listar amigos
   * Historia 5.2: Sistema de amistad
   */
  async getFriends(userId, token) {
    try {
      // Obtener amistades donde el usuario es el que envió o recibió la solicitud
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { userId, status: 'ACCEPTED' },
            { friendId: userId, status: 'ACCEPTED' },
          ],
        },
      });

      // Extraer IDs de los amigos
      const friendIds = friendships.map(f => 
        f.userId === userId ? f.friendId : f.userId
      );

      if (friendIds.length === 0) {
        return [];
      }

      // Obtener perfiles de los amigos
      const profiles = await externalService.getUserProfiles(friendIds, token);

      // Crear mapa de perfiles
      const profileMap = new Map(profiles.map(p => [p.userId, p]));

      // Mapear amistades con perfiles
      return friendships.map(friendship => {
        const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
        return {
          friendshipId: friendship.id,
          userId: friendId,
          profile: profileMap.get(friendId) || null,
          friendsSince: friendship.acceptedAt,
        };
      });
    } catch (error) {
      console.error('Error obteniendo lista de amigos:', error);
      throw new Error('No se pudo obtener la lista de amigos');
    }
  }

  /**
   * Eliminar amistad
   * Historia 5.2: Sistema de amistad
   */
  async removeFriend(userId, friendshipId) {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });

      if (!friendship) {
        throw new Error('Amistad no encontrada');
      }

      // Verificar que el usuario es parte de la amistad
      if (friendship.userId !== userId && friendship.friendId !== userId) {
        throw new Error('No tienes permiso para eliminar esta amistad');
      }

      // Eliminar la amistad
      await prisma.friendship.delete({
        where: { id: friendshipId },
      });

      return { message: 'Amistad eliminada exitosamente' };
    } catch (error) {
      console.error('Error eliminando amistad:', error);
      throw error;
    }
  }

  /**
   * Verificar si dos usuarios son amigos
   */
  async areFriends(userId, friendId) {
    try {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId, status: 'ACCEPTED' },
            { userId: friendId, friendId: userId, status: 'ACCEPTED' },
          ],
        },
      });

      return !!friendship;
    } catch (error) {
      console.error('Error verificando amistad:', error);
      return false;
    }
  }

  /**
   * Crear notificación
   */
  async createNotification(userId, senderId, type, title, message, metadata = {}) { // ✅ Agregado senderId
    try {
      return await prisma.notification.create({
        data: {
          userId,
          senderId, // ✅ Agregado
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

module.exports = new FriendsService();
/*
const prisma = require('../config/database');
const externalService = require('./external.service');
const { createNotificationMetadata } = require('../utils/helpers');

class FriendsService {
  /**
   * Enviar solicitud de amistad
   * Historia 5.2: Sistema de amistad
   */
  /*
  async sendFriendRequest(userId, friendId, token) {
    try {
      // Validar que no intente enviarse solicitud a sí mismo
      if (userId === friendId) {
        throw new Error('No puedes enviarte una solicitud de amistad a ti mismo');
      }

      // Verificar que el usuario destino existe
      await externalService.getUserProfile(friendId, token);

      // Verificar si ya existe una solicitud o amistad
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      });

      if (existing) {
        if (existing.status === 'ACCEPTED') {
          throw new Error('Ya son amigos');
        }
        if (existing.status === 'PENDING') {
          throw new Error('Ya existe una solicitud pendiente');
        }
        if (existing.status === 'REJECTED') {
          // Permitir reenviar después de rechazo
          const friendship = await prisma.friendship.update({
            where: { id: existing.id },
            data: {
              status: 'PENDING',
              requestedAt: new Date(),
            },
          });

          // Crear notificación
          await this.createNotification(
            friendId,
            'FRIEND_REQUEST',
            'Nueva solicitud de amistad',
            `Tienes una nueva solicitud de amistad`,
            { fromUserId: userId, friendshipId: friendship.id }
          );

          return friendship;
        }
      }

      // Crear nueva solicitud
      const friendship = await prisma.friendship.create({
        data: {
          userId,
          friendId,
          status: 'PENDING',
        },
      });

      // Crear notificación
      await this.createNotification(
        friendId,
        'FRIEND_REQUEST',
        'Nueva solicitud de amistad',
        `Tienes una nueva solicitud de amistad`,
        { fromUserId: userId, friendshipId: friendship.id }
      );

      return friendship;
    } catch (error) {
      console.error('Error enviando solicitud de amistad:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes de amistad recibidas
   * Historia 5.2: Sistema de amistad
   */
  /*
  async getFriendRequests(userId, token) {
    try {
      const requests = await prisma.friendship.findMany({
        where: {
          friendId: userId,
          status: 'PENDING',
        },
        orderBy: {
          requestedAt: 'desc',
        },
      });

      // Obtener información de los usuarios que enviaron las solicitudes
      const userIds = requests.map(r => r.userId);
      const profiles = await externalService.getMultipleProfiles(userIds, token);

      // Mapear perfiles con solicitudes
      const profileMap = new Map(profiles.map(p => [p.userId, p]));

      return requests.map(request => ({
        ...request,
        user: profileMap.get(request.userId) || null,
      }));
    } catch (error) {
      console.error('Error obteniendo solicitudes de amistad:', error);
      throw new Error('No se pudieron obtener las solicitudes de amistad');
    }
  }

  /**
   * Aceptar solicitud de amistad
   * Historia 5.2: Sistema de amistad
   */
  /*
  async acceptFriendRequest(userId, friendshipId, token) {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });

      if (!friendship) {
        throw new Error('Solicitud de amistad no encontrada');
      }

      // Verificar que el usuario es el receptor de la solicitud
      if (friendship.friendId !== userId) {
        throw new Error('No tienes permiso para aceptar esta solicitud');
      }

      if (friendship.status !== 'PENDING') {
        throw new Error('Esta solicitud ya fue procesada');
      }

      // Aceptar la solicitud
      const accepted = await prisma.friendship.update({
        where: { id: friendshipId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // Crear notificación para el usuario que envió la solicitud
      await this.createNotification(
        friendship.userId,
        'FRIEND_ACCEPTED',
        'Solicitud aceptada',
        `Tu solicitud de amistad fue aceptada`,
        { byUserId: userId, friendshipId: accepted.id }
      );

      // Otorgar puntos XP por hacer un amigo
      await externalService.awardPoints(
        userId,
        10,
        'Aceptar solicitud de amistad',
        token
      );

      await externalService.awardPoints(
        friendship.userId,
        10,
        'Solicitud de amistad aceptada',
        token
      );

      return accepted;
    } catch (error) {
      console.error('Error aceptando solicitud de amistad:', error);
      throw error;
    }
  }

  /**
   * Rechazar solicitud de amistad
   * Historia 5.2: Sistema de amistad
   */
  /*
  async rejectFriendRequest(userId, friendshipId) {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });

      if (!friendship) {
        throw new Error('Solicitud de amistad no encontrada');
      }

      // Verificar que el usuario es el receptor de la solicitud
      if (friendship.friendId !== userId) {
        throw new Error('No tienes permiso para rechazar esta solicitud');
      }

      if (friendship.status !== 'PENDING') {
        throw new Error('Esta solicitud ya fue procesada');
      }

      // Rechazar la solicitud
      return await prisma.friendship.update({
        where: { id: friendshipId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error rechazando solicitud de amistad:', error);
      throw error;
    }
  }

  /**
   * Listar amigos
   * Historia 5.2: Sistema de amistad
   */
  /*
  async getFriends(userId, token) {
    try {
      // Obtener amistades donde el usuario es el que envió o recibió la solicitud
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { userId, status: 'ACCEPTED' },
            { friendId: userId, status: 'ACCEPTED' },
          ],
        },
      });

      // Extraer IDs de los amigos
      const friendIds = friendships.map(f => 
        f.userId === userId ? f.friendId : f.userId
      );

      if (friendIds.length === 0) {
        return [];
      }

      // Obtener perfiles de los amigos
      const profiles = await externalService.getMultipleProfiles(friendIds, token);

      // Crear mapa de perfiles
      const profileMap = new Map(profiles.map(p => [p.userId, p]));

      // Mapear amistades con perfiles
      return friendships.map(friendship => {
        const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
        return {
          friendshipId: friendship.id,
          userId: friendId,
          profile: profileMap.get(friendId) || null,
          friendsSince: friendship.acceptedAt,
        };
      });
    } catch (error) {
      console.error('Error obteniendo lista de amigos:', error);
      throw new Error('No se pudo obtener la lista de amigos');
    }
  }

  /**
   * Eliminar amistad
   * Historia 5.2: Sistema de amistad
   */
  /*
  async removeFriend(userId, friendshipId) {
    try {
      const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });

      if (!friendship) {
        throw new Error('Amistad no encontrada');
      }

      // Verificar que el usuario es parte de la amistad
      if (friendship.userId !== userId && friendship.friendId !== userId) {
        throw new Error('No tienes permiso para eliminar esta amistad');
      }

      // Eliminar la amistad
      await prisma.friendship.delete({
        where: { id: friendshipId },
      });

      return { message: 'Amistad eliminada exitosamente' };
    } catch (error) {
      console.error('Error eliminando amistad:', error);
      throw error;
    }
  }

  /**
   * Verificar si dos usuarios son amigos
   */
  /*
  async areFriends(userId, friendId) {
    try {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId, status: 'ACCEPTED' },
            { userId: friendId, friendId: userId, status: 'ACCEPTED' },
          ],
        },
      });

      return !!friendship;
    } catch (error) {
      console.error('Error verificando amistad:', error);
      return false;
    }
  }

  /**
   * Crear notificación
   */
  /*
  async createNotification(userId, type, title, message, metadata = {}) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          metadata: createNotificationMetadata(type, metadata),
        },
      });
    } catch (error) {
      console.error('Error creando notificación:', error);
      // No lanzar error, las notificaciones son secundarias
      return null;
    }
  }
}

module.exports = new FriendsService();
*/