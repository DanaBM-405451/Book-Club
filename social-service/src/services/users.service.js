// src/services/users.service.js

const externalService = require('./external.service');

class UsersService {
  /**
   * Buscar usuarios (Con cálculo de estado de amistad)
   */
  async searchUsers(currentUserId, query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // 1. Buscar usuarios básicos
    const users = await prisma.profile.findMany({
      where: {
        OR: [
          { username: { contains: query } }, 
          { nombre: { contains: query } },
          { apellido: { contains: query } }
        ],
        // Excluirse a uno mismo de los resultados
        userId: { not: currentUserId }
      },
      select: {
        id: true, userId: true, username: true, nombre: true, apellido: true, avatarUrl: true, bio: true
      },
      skip,
      take: parseInt(limit)
    });

    // 2. Si no hay usuario logueado, devolver sin estado
    if (!currentUserId) return { data: users, pagination: { /* ... */ } };

    // 3. ✅ Calcular estado de amistad para cada resultado
    // Nota: Esto asume que user-service tiene acceso a la tabla 'friendships'.
    // Si están en la misma BD física (monolito modular), esto funciona perfecto.
    const usersWithStatus = await Promise.all(users.map(async (user) => {
      
      // Buscamos si existe relación A->B o B->A
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: currentUserId, friendId: user.userId },
            { userId: user.userId, friendId: currentUserId }
          ]
        }
      });

      let status = 'NONE';

      if (friendship) {
        if (friendship.status === 'ACCEPTED') {
          status = 'FRIENDS';
        } else if (friendship.status === 'PENDING') {
          // Si yo soy el userId (emisor), entonces dice "PENDING_SENT"
          // Si yo soy el friendId (receptor), dice "PENDING_RECEIVED"
          status = friendship.userId === currentUserId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
        } else if (friendship.status === 'REJECTED') {
            // Si está rechazada, permitimos volver a enviar (NONE) o mostramos algo específico
            status = 'NONE'; 
        }
      }

      return { ...user, friendshipStatus: status };
    }));

    // Obtener el total para la paginación
    const total = await prisma.profile.count({ /* ... mismo where ... */ });

    return {
      data: usersWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener perfil público de un usuario
   */
  async getUserPublicProfile(userId, token) {
    try {
      const profile = await externalService.getUserProfile(userId, token);
      
      return {
        success: true,
        data: profile
      };
    } catch (error) {
      console.error('Error obteniendo perfil público:', error);
      throw new Error('No se pudo obtener el perfil del usuario');
    }
  }
}

module.exports = new UsersService();