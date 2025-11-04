// gamification-service/src/controllers/gamification.controller.js

const gamificationService = require('../services/gamification.service');

class GamificationController {
  /**
   * Obtener estadísticas del usuario
   */
  async getStats(req, res, next) {
    try {
      // ✅ CORREGIDO: usar req.user.id
      const userId = req.user.userId || req.user.id;

      console.log('📊 Getting stats for userId:', userId);

      const stats = await gamificationService.getUserStats(userId);

      // Calcular info adicional del nivel
      const levelInfo = gamificationService.calculateLevel(stats.totalXP);

      res.status(200).json({
        success: true,
        data: {
          stats: {
            ...stats,
            levelProgress: levelInfo.progress,
            xpInCurrentLevel: levelInfo.xpInCurrentLevel,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Agregar páginas leídas
   */
  async addPages(req, res, next) {
    try {
      // ✅ CORREGIDO
      const userId = req.user.userId || req.user.id;
      const { pagesRead, bookId } = req.body;

      console.log('📖 Adding pages for userId:', userId);

      if (!pagesRead || pagesRead < 1) {
        return res.status(400).json({
          success: false,
          message: 'pagesRead debe ser un número positivo',
        });
      }

      const result = await gamificationService.addPagesRead(userId, pagesRead, bookId);

      res.status(200).json({
        success: true,
        message: result.leveledUp
          ? `¡Subiste al nivel ${result.newLevel}!`
          : 'Progreso actualizado',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar libro como iniciado
   */
  async bookStarted(req, res, next) {
    try {
      // ✅ CORREGIDO
      const userId = req.user.userId || req.user.id;
      await gamificationService.bookStarted(userId);

      res.status(200).json({
        success: true,
        message: 'Libro marcado como iniciado',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar libro como terminado
   */
  async bookFinished(req, res, next) {
    try {
      // ✅ CORREGIDO
      const userId = req.user.userId || req.user.id;
      const { totalPages } = req.body;

      await gamificationService.bookFinished(userId, totalPages || 0);

      res.status(200).json({
        success: true,
        message: '¡Felicitaciones! Libro terminado',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener logros del usuario
   */
  async getUserAchievements(req, res, next) {
    try {
      // ✅ CORREGIDO
      const userId = req.user.userId || req.user.id;
      const achievements = await gamificationService.getUserAchievements(userId);

      res.status(200).json({
        success: true,
        data: {
          achievements,
          total: achievements.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los logros disponibles
   */
  async getAllAchievements(req, res, next) {
    try {
      // ✅ CORREGIDO
      const userId = req.user.userId || req.user.id;

      const allAchievements = await gamificationService.getAllAchievements();
      const userAchievements = await gamificationService.getUserAchievements(userId);

      const unlockedIds = userAchievements.map((ua) => ua.achievementId);

      // Marcar cuáles están desbloqueados
      const achievementsWithStatus = allAchievements.map((achievement) => ({
        ...achievement,
        unlocked: unlockedIds.includes(achievement.id),
        unlockedAt:
          userAchievements.find((ua) => ua.achievementId === achievement.id)?.unlockedAt ||
          null,
      }));

      res.status(200).json({
        success: true,
        data: {
          achievements: achievementsWithStatus,
          total: allAchievements.length,
          unlocked: unlockedIds.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener actividad reciente
   */
  async getRecentActivity(req, res, next) {
    try {
      // ✅ CORREGIDO
      const userId = req.user.userId || req.user.id;
      const days = parseInt(req.query.days) || 30;

      const activities = await gamificationService.getRecentActivity(userId, days);

      res.status(200).json({
        success: true,
        data: {
          activities,
          days,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener leaderboard
   */
  async getLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const type = req.query.type || 'xp'; // xp, books, pages, streak

      const leaderboard = await gamificationService.getLeaderboard(limit, type);

      res.status(200).json({
        success: true,
        data: {
          leaderboard,
          type,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ✅ NUEVO: Actualizar estadísticas (llamado desde library-service)
   */
  async updateStats(req, res, next) {
    try {
      const { userId, xpGained, pagesRead, minutesRead, booksCompleted, reason } = req.body;

      console.log('🎮 Updating stats from library-service:', { userId, xpGained, pagesRead });

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId es requerido',
        });
      }

      const result = await gamificationService.updateStatsFromLibrary(
        userId,
        {
          xpGained: xpGained || 0,
          pagesRead: pagesRead || 0,
          minutesRead: minutesRead || 0,
          booksCompleted: booksCompleted || 0,
        },
        reason
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GamificationController();

/*const gamificationService = require('../services/gamification.service');

class GamificationController {
  /**
   * Obtener estadísticas del usuario
   */
  /*
  async getStats(req, res, next) {
    try {
      const userId = req.user.userId;
      const stats = await gamificationService.getUserStats(userId);

      // Calcular info adicional del nivel
      const levelInfo = gamificationService.calculateLevel(stats.totalXP);

      res.status(200).json({
        success: true,
        data: {
          stats: {
            ...stats,
            levelProgress: levelInfo.progress,
            xpInCurrentLevel: levelInfo.xpInCurrentLevel,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Agregar páginas leídas
   */
  /*
  async addPages(req, res, next) {
    try {
      const userId = req.user.userId;
      const { pagesRead, bookId } = req.body;

      if (!pagesRead || pagesRead < 1) {
        return res.status(400).json({
          success: false,
          message: 'pagesRead debe ser un número positivo',
        });
      }

      const result = await gamificationService.addPagesRead(userId, pagesRead, bookId);

      res.status(200).json({
        success: true,
        message: result.leveledUp 
          ? `¡Subiste al nivel ${result.newLevel}!` 
          : 'Progreso actualizado',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar libro como iniciado
   */
  /*
  async bookStarted(req, res, next) {
    try {
      const userId = req.user.userId;
      await gamificationService.bookStarted(userId);

      res.status(200).json({
        success: true,
        message: 'Libro marcado como iniciado',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar libro como terminado
   */
  /*
  async bookFinished(req, res, next) {
    try {
      const userId = req.user.userId;
      const { totalPages } = req.body;

      await gamificationService.bookFinished(userId, totalPages || 0);

      res.status(200).json({
        success: true,
        message: '¡Felicitaciones! Libro terminado',
      });
    } catch (error) {
      next(error);
    }
  }

  /* ✅ NUEVO: Actualizar estadísticas desde library-service
   * Este endpoint será llamado por library-service cuando:
   * - Usuario lee páginas
   * - Usuario crea anotaciones
   * - Usuario termina un libro
   */
  /*
  async updateStats(req, res, next) {
    try {
      const {
        userId,
        xpGained,
        pagesRead,
        minutesRead,
        booksCompleted,
        reason
      } = req.body;

      // Validar datos
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId es requerido'
        });
      }

      // Actualizar estadísticas
      const result = await gamificationService.updateStatsFromLibrary(
        userId,
        {
          xpGained: xpGained || 0,
          pagesRead: pagesRead || 0,
          minutesRead: minutesRead || 0,
          booksCompleted: booksCompleted || 0
        },
        reason
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * Obtener logros del usuario
   */
  /*
  async getUserAchievements(req, res, next) {
    try {
      const userId = req.user.userId;
      const achievements = await gamificationService.getUserAchievements(userId);

      res.status(200).json({
        success: true,
        data: {
          achievements,
          total: achievements.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los logros disponibles
   */
  /*
  async getAllAchievements(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const allAchievements = await gamificationService.getAllAchievements();
      const userAchievements = await gamificationService.getUserAchievements(userId);
      
      const unlockedIds = userAchievements.map(ua => ua.achievementId);
      
      // Marcar cuáles están desbloqueados
      const achievementsWithStatus = allAchievements.map(achievement => ({
        ...achievement,
        unlocked: unlockedIds.includes(achievement.id),
        unlockedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.unlockedAt || null,
      }));

      res.status(200).json({
        success: true,
        data: {
          achievements: achievementsWithStatus,
          total: allAchievements.length,
          unlocked: unlockedIds.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener actividad reciente
   */
  /*
  async getRecentActivity(req, res, next) {
    try {
      const userId = req.user.userId;
      const days = parseInt(req.query.days) || 30;

      const activities = await gamificationService.getRecentActivity(userId, days);

      res.status(200).json({
        success: true,
        data: {
          activities,
          days,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener leaderboard
   */
  /*
  async getLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const type = req.query.type || 'xp'; // xp, books, pages, streak

      const leaderboard = await gamificationService.getLeaderboard(limit, type);

      res.status(200).json({
        success: true,
        data: {
          leaderboard,
          type,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GamificationController();
*/