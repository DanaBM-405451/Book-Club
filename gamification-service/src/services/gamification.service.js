// gamification-service/src/services/gamification.service.js

const prisma = require('../config/database');

class GamificationService {
  
  // --- MÉTODOS BASE ---

  async createUserStats(userId) {
    try {
      return await prisma.userStats.create({ data: { userId } });
    } catch (error) {
      if (error.code === 'P2002') {
        return await prisma.userStats.findUnique({ where: { userId } });
      }
      throw error;
    }
  }

  async getUserStats(userId) {
    let stats = await prisma.userStats.findUnique({ where: { userId } });
    if (!stats) stats = await this.createUserStats(userId);
    return stats;
  }

  calculateLevel(totalXP, currentLevel = 1) {
    let level = 1;
    let xpRequired = 100;
    let accumulatedXP = 0;

    while (totalXP >= accumulatedXP + xpRequired) {
      accumulatedXP += xpRequired;
      level++;
      xpRequired += 50;
    }

    const xpForNextLevel = accumulatedXP + xpRequired;
    const xpInCurrentLevel = totalXP - accumulatedXP;
    const progress = (xpInCurrentLevel / xpRequired) * 100;
    const leveledUp = level > currentLevel;

    return { level, xpForNextLevel, xpInCurrentLevel, progress, leveledUp };
  }

  // --- MÉTODOS DE ACTUALIZACIÓN ---

  async updateStatsFromLibrary(userId, updates, reason) {
    console.log('🎮 updateStatsFromLibrary:', { userId, updates, reason });

    let stats = await this.getUserStats(userId);

    // Calcular nuevos valores
    const xpGained = updates.xpGained || 0;
    const newTotalXP = stats.totalXP + xpGained;
    const levelInfo = this.calculateLevel(newTotalXP, stats.currentLevel);

    const newTotalPages = stats.totalPagesRead + (updates.pagesRead || 0);
    const newTotalTime = stats.totalReadingTime + (updates.minutesRead || 0);
    const newBooksRead = stats.totalBooksRead + (updates.booksCompleted || 0);

    // --- Racha ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = stats.currentStreak;
    let newLongestStreak = stats.longestStreak;

    // Detectar cualquier actividad
    const hasActivity = (updates.pagesRead > 0) || (updates.minutesRead > 0) || (updates.booksCompleted > 0);

    if (hasActivity) {
      if (stats.lastReadDate) {
        const lastRead = new Date(stats.lastReadDate);
        lastRead.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(today - lastRead);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak++;
          if (newStreak > newLongestStreak) newLongestStreak = newStreak;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
        newLongestStreak = 1;
      }
    }

    // Update Stats
    const updatedStats = await prisma.userStats.update({
      where: { userId },
      data: {
        totalXP: newTotalXP,
        currentLevel: levelInfo.level,
        xpForNextLevel: levelInfo.xpForNextLevel,
        totalPagesRead: newTotalPages,
        totalReadingTime: newTotalTime,
        totalBooksRead: newBooksRead,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastReadDate: hasActivity ? new Date() : stats.lastReadDate,
      },
    });

    // Registrar actividad diaria
    if (hasActivity) {
      await this.recordDailyActivity(
        userId, 
        updates.pagesRead || 0, 
        updates.minutesRead || 0, 
        null
      );
    }

    // Logros
    const newAchievements = await this.checkAchievements(userId, updatedStats);

    return {
      stats: updatedStats,
      leveledUp: levelInfo.leveledUp,
      previousLevel: stats.currentLevel,
      newLevel: levelInfo.level,
      xpGained,
      unlockedAchievements: newAchievements,
    };
  }

  async addPagesRead(userId, pagesRead, bookId = null) {
    return await this.updateStatsFromLibrary(
        userId, 
        { pagesRead, xpGained: pagesRead }, 
        'Manual addPages'
    );
  }

  /**
   * ✅ MÉTODO BLINDADO: SQL RAW para MySQL
   * Usa "ON DUPLICATE KEY UPDATE" para eliminar condiciones de carrera (Error P2002)
   */
  async recordDailyActivity(userId, pagesRead, minutesRead = 0, bookId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // 1. INSERT ATÓMICO O UPDATE
        // MySQL intentará insertar. Si la clave (userId + date) existe, hará el update.
        // Todo en una sola operación de base de datos.
        await prisma.$executeRaw`
            INSERT INTO reading_activities (id, userId, date, pagesRead, minutesRead, booksRead, createdAt)
            VALUES (UUID(), ${userId}, ${today}, ${pagesRead}, ${minutesRead}, '[]', NOW())
            ON DUPLICATE KEY UPDATE
                pagesRead = pagesRead + ${pagesRead},
                minutesRead = minutesRead + ${minutesRead};
        `;

        // 2. ACTUALIZAR ARRAY DE LIBROS (Operación secundaria)
        // Esto lo hacemos aparte porque manipular JSON strings en SQL Raw es propenso a errores
        // y no es crítico para la concurrencia numérica.
        if (bookId) {
             const activity = await prisma.readingActivity.findUnique({
                where: { userId_date: { userId, date: today } }
             });
             
             let books = [];
             try { books = JSON.parse(activity.booksRead); } catch(e){}
             
             if (!books.includes(bookId)) {
                 books.push(bookId);
                 await prisma.readingActivity.update({
                     where: { id: activity.id },
                     data: { booksRead: JSON.stringify(books) }
                 });
             }
        }

    } catch (error) {
      console.error('❌ Error fatal SQL Raw:', error.message);
    }
  }

  // --- LOGROS Y OTROS ---

  async bookStarted(userId) {
    const stats = await this.getUserStats(userId);
    await prisma.userStats.update({
      where: { userId },
      data: { totalBooksStarted: stats.totalBooksStarted + 1 },
    });
    await this.checkAchievements(userId);
  }

  async bookFinished(userId, totalPages) {
    await this.checkAchievements(userId);
  }

  async getUserAchievements(userId) {
    return await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  async getAllAchievements() {
    return await prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { rarity: 'asc' }],
    });
  }

  async checkAchievements(userId, stats = null) {
    if (!stats) stats = await this.getUserStats(userId);
    const allAchievements = await this.getAllAchievements();
    const unlockedIds = (await this.getUserAchievements(userId)).map(ua => ua.achievementId);
    const newlyUnlocked = [];

    for (const achievement of allAchievements) {
      if (unlockedIds.includes(achievement.id)) continue;
      let requirement;
      try { requirement = JSON.parse(achievement.requirement); } catch (e) { continue; }
      
      let unlocked = false;
      if (requirement.pagesRead && stats.totalPagesRead >= requirement.pagesRead) unlocked = true;
      else if (requirement.booksRead && stats.totalBooksRead >= requirement.booksRead) unlocked = true;
      else if (requirement.streak && stats.currentStreak >= requirement.streak) unlocked = true;
      else if (requirement.level && stats.currentLevel >= requirement.level) unlocked = true;

      if (unlocked) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });
        if (achievement.xpReward > 0) {
          await prisma.userStats.update({
            where: { userId },
            data: { totalXP: stats.totalXP + achievement.xpReward },
          });
        }
        newlyUnlocked.push(achievement);
      }
    }
    return newlyUnlocked;
  }

  async getRecentActivity(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    return await prisma.readingActivity.findMany({
      where: { userId, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });
  }

  async getLeaderboard(limit = 10, type = 'xp') {
    let orderBy = { totalXP: 'desc' };
    switch (type) {
      case 'books': orderBy = { totalBooksRead: 'desc' }; break;
      case 'pages': orderBy = { totalPagesRead: 'desc' }; break;
      case 'streak': orderBy = { currentStreak: 'desc' }; break;
    }
    return await prisma.userStats.findMany({ take: limit, orderBy });
  }
}

module.exports = new GamificationService();  

//const prisma = require('../config/database');

//class GamificationService {
  /**
   * Crear estadísticas iniciales para un usuario nuevo
   */
 /* async createUserStats(userId) {
    const stats = await prisma.userStats.create({
      data: { userId },
    });

    return stats;
  }

  /**
   * Obtener estadísticas del usuario
   */
  /*async getUserStats(userId) {
    let stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    // Si no existen stats, crearlas
    if (!stats) {
      stats = await this.createUserStats(userId);
    }

    return stats;
  }

  /**
   * Calcular nivel según XP
   * Fórmula: Nivel 1 = 0-99 XP, Nivel 2 = 100-249 XP, etc.
   */
 /* calculateLevel(totalXP, currentLevel = 1) {
    let level = 1;
    let xpRequired = 100;
    let accumulatedXP = 0;

    while (totalXP >= accumulatedXP + xpRequired) {
      accumulatedXP += xpRequired;
      level++;
      xpRequired += 50;
    }

    const xpForNextLevel = accumulatedXP + xpRequired;
    const xpInCurrentLevel = totalXP - accumulatedXP;
    const progress = (xpInCurrentLevel / xpRequired) * 100;

    // ✅ CORREGIDO: Retornar leveledUp correctamente
    const leveledUp = level > currentLevel;

    return {
      level,
      xpForNextLevel,
      xpInCurrentLevel,
      progress,
      leveledUp,  //  AGREGAR
    };
  }

  /**
   *  NUEVO: Actualizar estadísticas desde library-service
   */
  /*async updateStatsFromLibrary(userId, updates, reason) {
    console.log('🎮 updateStatsFromLibrary called:', { userId, updates, reason });

    // Obtener o crear stats
    let stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      console.log('📊 Creating new stats for user:', userId);
      stats = await this.createUserStats(userId);
    }

    // Calcular nuevo XP
    const xpGained = updates.xpGained || 0;
    const newTotalXP = stats.totalXP + xpGained;

    console.log('📈 XP Calculation:', {
      currentXP: stats.totalXP,
      xpGained,
      newTotalXP,
    });

    // Calcular nivel
    const levelInfo = this.calculateLevel(newTotalXP, stats.currentLevel);

    console.log('🎚️ Level Info:', levelInfo);

    // Actualizar páginas y libros
    const newTotalPages = stats.totalPagesRead + (updates.pagesRead || 0);
    const newTotalTime = stats.totalReadingTime + (updates.minutesRead || 0);
    const newBooksRead = stats.totalBooksRead + (updates.booksCompleted || 0);

    // Actualizar racha
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = stats.currentStreak;
    let newLongestStreak = stats.longestStreak;

    if (updates.pagesRead > 0) {
      if (stats.lastReadDate) {
        const lastRead = new Date(stats.lastReadDate);
        lastRead.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Mismo día
        } else if (diffDays === 1) {
          // Día consecutivo
          newStreak++;
          if (newStreak > newLongestStreak) {
            newLongestStreak = newStreak;
          }
        } else {
          // Racha rota
          newStreak = 1;
        }
      } else {
        // Primera vez
        newStreak = 1;
        newLongestStreak = 1;
      }
    }

    console.log('💾 Updating user stats in DB...');

    // Actualizar en BD
    const updatedStats = await prisma.userStats.update({
      where: { userId },
      data: {
        totalXP: newTotalXP,
        currentLevel: levelInfo.level,
        xpForNextLevel: levelInfo.xpForNextLevel,
        totalPagesRead: newTotalPages,
        totalReadingTime: newTotalTime,
        totalBooksRead: newBooksRead,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastReadDate: updates.pagesRead > 0 ? new Date() : stats.lastReadDate,
      },
    });

    console.log('✅ Stats updated successfully');

    // Registrar actividad diaria si leyó páginas
    if (updates.pagesRead > 0) {
      console.log('📅 Recording daily activity...');
      await this.recordDailyActivity(userId, updates.pagesRead, null);
    }

    // Verificar logros
    console.log('🏆 Checking achievements...');
    const newAchievements = await this.checkAchievements(userId, updatedStats);

    console.log('🎉 Process completed');

    return {
      stats: updatedStats,
      leveledUp: levelInfo.leveledUp,
      previousLevel: stats.currentLevel,
      newLevel: levelInfo.level,
      xpGained,
      unlockedAchievements: newAchievements,
    };
  }

  /**
   * Agregar páginas leídas y calcular XP
   */
 /* async addPagesRead(userId, pagesRead, bookId = null) {
    const stats = await this.getUserStats(userId);

    // Calcular nuevo XP
    const newTotalXP = stats.totalXP + pagesRead;
    const newTotalPages = stats.totalPagesRead + pagesRead;

    // Calcular nuevo nivel
    const levelInfo = this.calculateLevel(newTotalXP, stats.currentLevel);

    // Actualizar racha
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = stats.currentStreak;
    let newLongestStreak = stats.longestStreak;

    if (stats.lastReadDate) {
      const lastRead = new Date(stats.lastReadDate);
      lastRead.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Mismo día
      } else if (diffDays === 1) {
        // Día consecutivo
        newStreak++;
        if (newStreak > newLongestStreak) {
          newLongestStreak = newStreak;
        }
      } else {
        // Racha rota
        newStreak = 1;
      }
    } else {
      // Primera vez
      newStreak = 1;
      newLongestStreak = 1;
    }

    // Actualizar stats
    const updatedStats = await prisma.userStats.update({
      where: { userId },
      data: {
        totalXP: newTotalXP,
        currentLevel: levelInfo.level,
        xpForNextLevel: levelInfo.xpForNextLevel,
        totalPagesRead: newTotalPages,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastReadDate: new Date(),
      },
    });

    // Registrar actividad del día
    await this.recordDailyActivity(userId, pagesRead, bookId);

    // Verificar logros desbloqueados
    const newAchievements = await this.checkAchievements(userId, updatedStats);

    return {
      stats: updatedStats,
      leveledUp: levelInfo.leveledUp,
      previousLevel: stats.currentLevel,
      newLevel: levelInfo.level,
      newAchievements,
      streakIncreased: newStreak > stats.currentStreak,
    };
  }

  /**
   * Registrar actividad diaria
   */
  /*async recordDailyActivity(userId, pagesRead, bookId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const existing = await prisma.readingActivity.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      });

      if (existing) {
        // Actualizar actividad existente
        const booksRead = JSON.parse(existing.booksRead || '[]');
        if (bookId && !booksRead.includes(bookId)) {
          booksRead.push(bookId);
        }

        await prisma.readingActivity.update({
          where: {
            userId_date: {
              userId,
              date: today,
            },
          },
          data: {
            pagesRead: existing.pagesRead + pagesRead,
            booksRead: JSON.stringify(booksRead),
          },
        });
      } else {
        // Crear nueva actividad
        await prisma.readingActivity.create({
          data: {
            userId,
            date: today,
            pagesRead,
            minutesRead: 0,
            booksRead: JSON.stringify(bookId ? [bookId] : []),
          },
        });
      }
    } catch (error) {
      console.error('Error recording daily activity:', error);
    }
  }

  /**
   * Marcar libro como iniciado
   */
/*  async bookStarted(userId) {
    const stats = await this.getUserStats(userId);

    await prisma.userStats.update({
      where: { userId },
      data: {
        totalBooksStarted: stats.totalBooksStarted + 1,
      },
    });

    await this.checkAchievements(userId);
  }

  /**
   * Marcar libro como terminado
   */
/*  async bookFinished(userId, totalPages) {
    const stats = await this.getUserStats(userId);

    await prisma.userStats.update({
      where: { userId },
      data: {
        totalBooksRead: stats.totalBooksRead + 1,
      },
    });

    // Bonus XP por terminar libro (10% del total de páginas)
    const bonusXP = Math.floor(totalPages * 0.1);
    if (bonusXP > 0) {
      await this.addPagesRead(userId, bonusXP);
    }

    await this.checkAchievements(userId);
  }

  /**
   * Obtener logros desbloqueados del usuario
   */
 /* async getUserAchievements(userId) {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    });

    return achievements;
  }

  /**
   * Obtener todos los logros disponibles
   */
 /* async getAllAchievements() {
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { rarity: 'asc' }],
    });

    return achievements;
  }

  /**
   * Verificar y desbloquear logros
   */
 /* async checkAchievements(userId, stats = null) {
    if (!stats) {
      stats = await this.getUserStats(userId);
    }

    // Obtener todos los logros
    const allAchievements = await this.getAllAchievements();

    // Obtener logros ya desbloqueados
    const unlockedIds = (await this.getUserAchievements(userId)).map(
      (ua) => ua.achievementId
    );

    const newlyUnlocked = [];

    for (const achievement of allAchievements) {
      // Si ya está desbloqueado, saltar
      if (unlockedIds.includes(achievement.id)) continue;

      // Parsear requisito
      const requirement = JSON.parse(achievement.requirement);

      // Verificar si cumple requisito
      let unlocked = false;

      if (requirement.pagesRead && stats.totalPagesRead >= requirement.pagesRead) {
        unlocked = true;
      } else if (requirement.booksRead && stats.totalBooksRead >= requirement.booksRead) {
        unlocked = true;
      } else if (requirement.streak && stats.currentStreak >= requirement.streak) {
        unlocked = true;
      } else if (requirement.level && stats.currentLevel >= requirement.level) {
        unlocked = true;
      }

      // Desbloquear logro
      if (unlocked) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        // Otorgar XP del logro
        if (achievement.xpReward > 0) {
          await prisma.userStats.update({
            where: { userId },
            data: {
              totalXP: stats.totalXP + achievement.xpReward,
            },
          });
        }

        newlyUnlocked.push(achievement);
        console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.xpReward} XP)`);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Obtener actividad de los últimos N días
   */
 /* async getRecentActivity(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const activities = await prisma.readingActivity.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return activities;
  }

  /**
   * Obtener leaderboard (ranking de usuarios)
   */
 /* async getLeaderboard(limit = 10, type = 'xp') {
    let orderBy = {};

    switch (type) {
      case 'xp':
        orderBy = { totalXP: 'desc' };
        break;
      case 'books':
        orderBy = { totalBooksRead: 'desc' };
        break;
      case 'pages':
        orderBy = { totalPagesRead: 'desc' };
        break;
      case 'streak':
        orderBy = { currentStreak: 'desc' };
        break;
      default:
        orderBy = { totalXP: 'desc' };
    }

    const leaderboard = await prisma.userStats.findMany({
      take: limit,
      orderBy,
    });

    return leaderboard;
  }
}

module.exports = new GamificationService();*/