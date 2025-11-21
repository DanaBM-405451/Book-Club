// social-service/src/services/goals.service.js

const { prisma } = require('../config/database');
const externalService = require('./external.service');
const { getDateRangeForFrequency, createNotificationMetadata } = require('../utils/helpers');

class GoalsService {
  /**
   * Crear meta de lectura (solo admin)
   * Historia 5.5: Metas de lectura grupales
   */
  async createGoal(groupId, userId, data, token) {
    try {
      const { bookId, bookTitle, startDate, endDate, targetPages, frequency = 'WEEKLY' } = data;

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
        throw new Error('Solo el administrador puede crear metas de lectura');
      }

      // Verificar que el libro existe
      try {
        await externalService.getBookById(bookId, token);
      } catch (error) {
        console.warn('No se pudo validar el libro:', error.message);
      }

      // Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
      }

      if (start < new Date()) {
        throw new Error('La fecha de inicio no puede ser en el pasado');
      }

      // metas activas ?
      await prisma.readingGoal.updateMany({
  where: {
    groupId,
    status: 'ACTIVE',
  },
  data: {
    status: 'CANCELLED',
  },
});

      // Crear la meta
      const goal = await prisma.readingGoal.create({
        data: {
          groupId,
          bookId,
          bookTitle,
          startDate: start,
          endDate: end,
          targetPages,
          frequency,
          createdBy: userId,
          status: 'ACTIVE',
        },
      });

      // Notificar a todos los miembros del grupo
      await this.notifyGroupMembers(
        groupId,
        userId,
        'GOAL_CREATED',
        'Nueva meta de lectura',
        `Se ha creado una nueva meta de lectura: ${bookTitle}`,
        { goalId: goal.id, groupId }
      );

      return goal;
    } catch (error) {
      console.error('Error creando meta de lectura:', error);
      throw error;
    }
  }

  /**
   * Obtener metas de un grupo
   * Historia 5.5: Metas de lectura grupales
   */
  async getGroupGoals(groupId, userId, includeInactive = false, token) {
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
        throw new Error('Solo los miembros pueden ver las metas del grupo');
      }

      const where = {
        groupId,
        ...(includeInactive ? {} : { status: 'ACTIVE' }),
      };

      const goals = await prisma.readingGoal.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Obtener información de los libros
      const goalsWithBooks = [];

      for (const goal of goals) {
        let book = null;
        try {
          book = await externalService.getBookById(goal.bookId, token);
        } catch (error) {
          console.error(`Error obteniendo libro ${goal.bookId}:`, error);
        }

        goalsWithBooks.push({
          ...goal,
          book,
          daysRemaining: this.calculateDaysRemaining(goal.endDate),
          isExpired: new Date(goal.endDate) < new Date(),
        });
      }

      return goalsWithBooks;
    } catch (error) {
      console.error('Error obteniendo metas del grupo:', error);
      throw error;
    }
  }

  /**
   * Obtener meta activa del grupo
   */
  async getActiveGoal(groupId, userId, token) {
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
        throw new Error('Solo los miembros pueden ver las metas del grupo');
      }

      const goal = await prisma.readingGoal.findFirst({
        where: {
          groupId,
          status: 'ACTIVE',
        },
      });

      if (!goal) {
        return null;
      }

      // Obtener información del libro
      let book = null;
      try {
        book = await externalService.getBookById(goal.bookId, token);
      } catch (error) {
        console.error(`Error obteniendo libro ${goal.bookId}:`, error);
      }

      return {
        ...goal,
        book,
        daysRemaining: this.calculateDaysRemaining(goal.endDate),
        isExpired: new Date(goal.endDate) < new Date(),
      };
    } catch (error) {
      console.error('Error obteniendo meta activa:', error);
      throw error;
    }
  }

  /**
   * Actualizar meta de lectura (solo admin)
   * Historia 5.5: Metas de lectura grupales
   */
  async updateGoal(groupId, goalId, userId, data, token) {
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
        throw new Error('Solo el administrador puede editar metas de lectura');
      }

      // Verificar que la meta pertenece al grupo
      const goal = await prisma.readingGoal.findUnique({
        where: { id: goalId },
      });

      if (!goal || goal.groupId !== groupId) {
        throw new Error('Meta de lectura no encontrada');
      }

      // Validar fechas si se actualizan
      if (data.startDate || data.endDate) {
  const start = new Date(data.startDate || goal.startDate);
  const end = new Date(data.endDate || goal.endDate);

  if (start >= end) {
    throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
  }
}
const updateData = { ...data };
if (updateData.startDate) {
  updateData.startDate = new Date(updateData.startDate);
}
if (updateData.endDate) {
  updateData.endDate = new Date(updateData.endDate);
}

      // Actualizar la meta
      return await prisma.readingGoal.update({
  where: { id: goalId },
  data: updateData,
});
    } catch (error) {
      console.error('Error actualizando meta de lectura:', error);
      throw error;
    }
  }

  /**
   * Marcar meta como completada (automático o manual por admin)
   */
  async completeGoal(groupId, goalId, userId) {
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
        throw new Error('Solo el administrador puede completar metas de lectura');
      }

      // Verificar que la meta pertenece al grupo
      const goal = await prisma.readingGoal.findUnique({
        where: { id: goalId },
      });

      if (!goal || goal.groupId !== groupId) {
        throw new Error('Meta de lectura no encontrada');
      }

      // Marcar como completada
      const completed = await prisma.readingGoal.update({
        where: { id: goalId },
        data: {
          status: 'COMPLETED',
        },
      });

      // Notificar a todos los miembros
      await this.notifyGroupMembers(
        groupId,
        userId,
        'GOAL_COMPLETED',
        'Meta de lectura completada',
        `El grupo ha completado la meta de lectura: ${goal.bookTitle}`,
        { goalId, groupId }
      );

      return completed;
    } catch (error) {
      console.error('Error completando meta de lectura:', error);
      throw error;
    }
  }

  /**
   * Eliminar meta (solo admin)
   */
  async deleteGoal(groupId, goalId, userId) {
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
        throw new Error('Solo el administrador puede eliminar metas de lectura');
      }

      // Verificar que la meta pertenece al grupo
      const goal = await prisma.readingGoal.findUnique({
        where: { id: goalId },
      });

      if (!goal || goal.groupId !== groupId) {
        throw new Error('Meta de lectura no encontrada');
      }

      // Eliminar la meta
      await prisma.readingGoal.delete({
        where: { id: goalId },
      });

      return { message: 'Meta de lectura eliminada exitosamente' };
    } catch (error) {
      console.error('Error eliminando meta de lectura:', error);
      throw error;
    }
  }

  /**
   * Calcular días restantes para una fecha
   */
  calculateDaysRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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
        this.createNotification(member.userId, type, title, message, metadata)
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Error notificando a miembros del grupo:', error);
    }
  }

  /**
   * Crear notificación
   */
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
      return null;
    }
  }
}

module.exports = new GoalsService();