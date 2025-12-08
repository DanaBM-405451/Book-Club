/*// src/services/goals.service.js

const { prisma } = require('../config/database');
const externalService = require('./external.service');

class GoalsService {
  **
   * Obtener metas del grupo
   *
  async getGoals(groupId, includeInactive = false) {
    try {
      const where = { groupId };
      
      if (!includeInactive) {
        where.status = 'ACTIVE';
      }

      const goals = await prisma.readingGoal.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return goals.map(goal => {
        const now = new Date();
        const startDate = new Date(goal.startDate);
        const endDate = new Date(goal.endDate);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        return {
          ...goal,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          isExpired: endDate < now && goal.status === 'ACTIVE'
        };
      });

    } catch (error) {
      console.error('Error obteniendo metas:', error);
      throw new Error('No se pudieron obtener las metas');
    }
  }

  **
   * Crear una meta de lectura
   */
  /**
   * Crear una meta de lectura
   *
  async createGoal(groupId, userId, data, token) {
    try {
      const {
        bookId,
        bookTitle,
        startDate,
        endDate,
        targetPages,
        frequency = 'WEEKLY',
        description
      } = data;

      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede crear metas');
      }

      // Verificar que no haya otra meta activa
      const activeGoal = await prisma.readingGoal.findFirst({
        where: {
          groupId,
          status: 'ACTIVE'
        }
      });

      if (activeGoal) {
        throw new Error('Ya existe una meta activa. Complétala o cancélala antes de crear una nueva.');
      }

      // Crear la meta
      const goal = await prisma.readingGoal.create({
        data: {
          groupId,
          bookId: parseInt(bookId),
          bookTitle,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          targetPages: parseInt(targetPages),
          frequency,
          description,
          status: 'ACTIVE',
          createdBy: userId // ✅ ESTA ES LA LÍNEA QUE FALTABA
        }
      });

      // Otorgar XP al admin
      try {
        await externalService.awardXP(
          userId,
          15,
          'Crear meta de lectura en grupo',
          token
        );
      } catch (error) {
        console.log('Error otorgando XP:', error.message);
      }

      return goal;

    } catch (error) {
      console.error('Error creando meta:', error);
      throw error;
    }
  }

  *
   * Obtener meta activa
   *
  async getActiveGoal(groupId) {
    try {
      const goal = await prisma.readingGoal.findFirst({
        where: {
          groupId,
          status: 'ACTIVE'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!goal) {
        return null;
      }

      const now = new Date();
      const endDate = new Date(goal.endDate);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Obtener información del libro si existe
      let book = null;
      if (goal.bookId) {
        try {
          const books = await externalService.getBooksByIds([goal.bookId], null);
          book = books[0] || null;
        } catch (error) {
          console.log('Error obteniendo libro:', error.message);
        }
      }

      return {
        ...goal,
        book,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isExpired: endDate < now
      };

    } catch (error) {
      console.error('Error obteniendo meta activa:', error);
      throw new Error('No se pudo obtener la meta activa');
    }
  }

  **
   * Actualizar una meta
   *
  async updateGoal(groupId, goalId, userId, data) {
    try {
      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede actualizar metas');
      }

      // Actualizar la meta
      const goal = await prisma.readingGoal.update({
        where: { id: goalId },
        data: {
          targetPages: data.targetPages ? parseInt(data.targetPages) : undefined,
          frequency: data.frequency,
          description: data.description,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          updatedAt: new Date()
        }
      });

      return goal;

    } catch (error) {
      console.error('Error actualizando meta:', error);
      throw error;
    }
  }

  **
   * Eliminar una meta
   *
  async deleteGoal(groupId, goalId, userId) {
    try {
      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede eliminar metas');
      }

      // Eliminar la meta
      await prisma.readingGoal.delete({
        where: { id: goalId }
      });

      return { message: 'Meta eliminada correctamente' };

    } catch (error) {
      console.error('Error eliminando meta:', error);
      throw error;
    }
  }

**
   * Completar una meta
   *
  async completeGoal(groupId, goalId, userId, token) {
    try {
      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede completar metas');
      }

      // Marcar como completada
      const goal = await prisma.groupGoal.update({
        where: { id: goalId },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });

      // Otorgar XP a todos los miembros del grupo
      try {
        const members = await prisma.groupMember.findMany({
          where: { groupId }
        });

        for (const member of members) {
          await externalService.awardXP(
            member.userId,
            30,
            'Completar meta de grupo',
            token
          );
        }
      } catch (error) {
        console.log('Error otorgando XP:', error.message);
      }

      return goal;

    } catch (error) {
      console.error('Error completando meta:', error);
      throw error;
    }
  }
}

module.exports = new GoalsService(); 
*/

// src/services/goals.service.js

const { prisma } = require('../config/database');
const externalService = require('./external.service');

class GoalsService {
  /**
   * Obtener metas del grupo
   */
  async getGoals(groupId, includeInactive = false) {
    try {
      const where = { groupId };
      
      if (!includeInactive) {
        where.status = 'ACTIVE';
      }

      const goals = await prisma.readingGoal.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return goals.map(goal => {
        const now = new Date();
        const startDate = new Date(goal.startDate);
        const endDate = new Date(goal.endDate);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        return {
          ...goal,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          isExpired: endDate < now && goal.status === 'ACTIVE'
        };
      });

    } catch (error) {
      console.error('Error obteniendo metas:', error);
      throw new Error('No se pudieron obtener las metas');
    }
  }

  /**
   * Crear una meta de lectura
   */
  async createGoal(groupId, userId, data, token) {
    try {
      const {
        bookId,
        bookTitle,
        startDate,
        endDate,
        targetPages,
        frequency = 'WEEKLY',
        description
      } = data;

      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede crear metas');
      }

      // Verificar que no haya otra meta activa
      const activeGoal = await prisma.readingGoal.findFirst({
        where: {
          groupId,
          status: 'ACTIVE'
        }
      });

      if (activeGoal) {
        throw new Error('Ya existe una meta activa. Complétala o cancélala antes de crear una nueva.');
      }

      // Crear la meta
      const goal = await prisma.readingGoal.create({
        data: {
          groupId,
          bookId: parseInt(bookId),
          bookTitle,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          targetPages: parseInt(targetPages),
          frequency,
          description,
          status: 'ACTIVE',
          createdBy: userId // ✅ CORRECCIÓN 1: Faltaba este campo obligatorio
        }
      });

      // Otorgar XP al admin
      try {
        await externalService.awardXP(
          userId,
          15,
          'Crear meta de lectura en grupo',
          token
        );
      } catch (error) {
        console.log('Error otorgando XP:', error.message);
      }

      return goal;

    } catch (error) {
      console.error('Error creando meta:', error);
      throw error;
    }
  }

  /**
   * Obtener meta activa
   */
  async getActiveGoal(groupId) {
    try {
      const goal = await prisma.readingGoal.findFirst({
        where: {
          groupId,
          status: 'ACTIVE'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!goal) {
        return null;
      }

      const now = new Date();
      const endDate = new Date(goal.endDate);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Obtener información del libro si existe
      let book = null;
      if (goal.bookId) {
        try {
          // Asegurarse de que getBooksByIds maneje el array correctamente
          // Nota: Si externalService falla, no rompemos todo, solo no mostramos la data extra
          const books = await externalService.getBooksByIds([goal.bookId], null).catch(() => []);
          book = books[0] || null;
        } catch (error) {
          console.log('Error obteniendo libro (no crítico):', error.message);
        }
      }

      return {
        ...goal,
        book, // Enviamos el objeto libro enriquecido
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isExpired: endDate < now
      };

    } catch (error) {
      console.error('Error obteniendo meta activa:', error);
      throw new Error('No se pudo obtener la meta activa');
    }
  }

  /**
   * Actualizar una meta
   */
  async updateGoal(groupId, goalId, userId, data) {
    try {
      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede actualizar metas');
      }

      // Actualizar la meta
      const goal = await prisma.readingGoal.update({
        where: { id: goalId },
        data: {
          targetPages: data.targetPages ? parseInt(data.targetPages) : undefined,
          frequency: data.frequency,
          description: data.description,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          updatedAt: new Date()
        }
      });

      return goal;

    } catch (error) {
      console.error('Error actualizando meta:', error);
      throw error;
    }
  }

  /**
   * Eliminar una meta
   */
  async deleteGoal(groupId, goalId, userId) {
    try {
      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede eliminar metas');
      }

      // Eliminar la meta
      await prisma.readingGoal.delete({
        where: { id: goalId }
      });

      return { message: 'Meta eliminada correctamente' };

    } catch (error) {
      console.error('Error eliminando meta:', error);
      throw error;
    }
  }

  /**
   * Completar una meta
   */
  async completeGoal(groupId, goalId, userId, token) {
    try {
      // Verificar que el usuario es admin
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      });

      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('Solo el administrador puede completar metas');
      }

      // Marcar como completada
      // ✅ CORRECCIÓN 2: Usar 'readingGoal', NO 'groupGoal'
      const goal = await prisma.readingGoal.update({ 
        where: { id: goalId },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });

      // Otorgar XP a todos los miembros del grupo
      try {
        const members = await prisma.groupMember.findMany({
          where: { groupId }
        });

        for (const member of members) {
          await externalService.awardXP(
            member.userId,
            30,
            'Completar meta de grupo',
            token
          );
        }
      } catch (error) {
        console.log('Error otorgando XP:', error.message);
      }

      return goal;

    } catch (error) {
      console.error('Error completando meta:', error);
      throw error;
    }
  }
}

module.exports = new GoalsService();