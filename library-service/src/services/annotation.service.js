// library-service/src/services/annotation.service.js

const prisma = require('../config/database');
const axios = require('axios');

class AnnotationService {
  /**
   * Crear anotación/highlight
   */
  async createAnnotation(userId, bookId, data) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId),
        book: { isDeleted: false },
      },
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    // ✅ CORREGIDO: Agregar userId
    const annotation = await prisma.annotation.create({
      data: {
        userId,                              // ✅ AGREGADO
        bookId: parseInt(bookId),
        userBookId: userBook.id,
        type: data.type || 'HIGHLIGHT',
        chapter: data.chapter,
        page: data.page,
        startOffset: data.startOffset,
        endOffset: data.endOffset,
        selectedText: data.selectedText,
        noteContent: data.noteContent,
        highlightColor: data.highlightColor || '#FFFF00',
        context: data.context,
        cfi: data.cfi,
        isPublic: data.isPublic || false,
        isFavorite: data.isFavorite || false,
      },
    });

    // Actualizar contador de anotaciones
    await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        totalAnnotations: { increment: 1 },
      },
    });

    // Gamificación: Otorgar XP por anotación
    const xpReward = this.calculateAnnotationXP(data.type);

    if (xpReward > 0) {
      await this.updateGamificationStats(userId, {
        xpGained: xpReward,
        reason: `ANNOTATION_${data.type}`,
      });

      await prisma.annotation.update({
        where: { id: annotation.id },
        data: { pointsAwarded: xpReward },
      });
    }

    return annotation;
  }

  /**
   * Calcular XP por tipo de anotación
   */
  calculateAnnotationXP(type) {
    const xpMap = {
      HIGHLIGHT: 5,
      UNDERLINE: 3,
      NOTE: 10,
      BOOKMARK: 2,
    };
    return xpMap[type] || 0;
  }

  /**
   * Registrar sesión de lectura
   */
  async recordReadingSession(userId, bookId, data) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId),
      },
      include: {
        book: true,
      },
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    const pagesRead = data.endPage - data.startPage + 1;
    const durationMinutes = Math.round(
      (new Date(data.endTime) - new Date(data.startTime)) / 60000
    );

    // Calcular XP: Base + bonos
    const baseXP = pagesRead * 2;
    const timeBonus = durationMinutes >= 30 ? 10 : 0;
    const focusBonus = durationMinutes >= 60 ? 20 : 0;
    const totalXP = baseXP + timeBonus + focusBonus;

    // ✅ CORREGIDO: Agregar userId
    const session = await prisma.readingSession.create({
      data: {
        userId,                              // ✅ AGREGADO
        bookId: parseInt(bookId),
        userBookId: userBook.id,
        startPage: data.startPage,
        endPage: data.endPage,
        pagesRead,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        durationMinutes,
        pointsEarned: totalXP,
        deviceType: data.deviceType,
      },
    });

    // Actualizar estadísticas del UserBook
    const progressPercent =
      userBook.totalPages > 0
        ? ((data.endPage / userBook.totalPages) * 100).toFixed(2)
        : 0;

    await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        currentPage: data.endPage,
        progressPercent: parseFloat(progressPercent),
        totalReadingTimeMinutes: {
          increment: durationMinutes,
        },
        lastReadPosition: data.lastReadPosition || `page-${data.endPage}`,
        lastReadAt: new Date(),
        status: userBook.status === 'QUIERO_LEER' ? 'LEYENDO' : userBook.status,
        startedAt: userBook.startedAt || new Date(),
      },
    });

    // Verificar si terminó el libro
    const bookCompleted = userBook.totalPages && data.endPage >= userBook.totalPages;

    if (bookCompleted && userBook.status !== 'COMPLETADO') {
      await prisma.userBook.update({
        where: { id: userBook.id },
        data: {
          status: 'COMPLETADO',
          finishedAt: new Date(),
        },
      });

      // XP extra por completar libro
      await this.updateGamificationStats(userId, {
        xpGained: totalXP + 50,
        pagesRead,
        minutesRead: durationMinutes,
        booksCompleted: 1,
        reason: 'BOOK_COMPLETED',
      });
    } else {
      // Actualizar estadísticas normales
      await this.updateGamificationStats(userId, {
        xpGained: totalXP,
        pagesRead,
        minutesRead: durationMinutes,
        reason: 'READING_SESSION',
      });
    }

    return {
      session,
      xpEarned: totalXP,
      bookCompleted,
    };
  }

  /**
   * Actualizar estadísticas en gamification-service
   */
  async updateGamificationStats(userId, data) {
    try {
      const response = await axios.post(
        `${process.env.GAMIFICATION_SERVICE_URL}/api/gamification/stats/update`,
        {
          userId,
          xpGained: data.xpGained || 0,
          pagesRead: data.pagesRead || 0,
          minutesRead: data.minutesRead || 0,
          booksCompleted: data.booksCompleted || 0,
          reason: data.reason,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      console.log(`✅ Stats updated for user ${userId}: +${data.xpGained} XP`);
      return response.data;
    } catch (error) {
      console.error('⚠️ Error updating gamification stats:', error.message);
      return null;
    }
  }

  /**
   * Obtener anotaciones de un libro
   */
  async getBookAnnotations(userId, bookId, filters = {}) {
    const { type, isFavorite, page } = filters;

    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId),
      },
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    const where = { userBookId: userBook.id };
    if (type) where.type = type;
    if (isFavorite !== undefined) where.isFavorite = isFavorite;
    if (page) where.page = parseInt(page);

    const annotations = await prisma.annotation.findMany({
      where,
      orderBy: [{ page: 'asc' }, { startOffset: 'asc' }],
    });

    return annotations;
  }

  /**
   * Actualizar anotación
   */
  async updateAnnotation(annotationId, userId, data) {
    const annotation = await prisma.annotation.findFirst({
      where: {
        id: parseInt(annotationId),
        userId,
      },
    });

    if (!annotation) {
      throw new Error('Anotación no encontrada');
    }

    const updateData = {};
    if (data.noteContent !== undefined) updateData.noteContent = data.noteContent;
    if (data.highlightColor !== undefined) updateData.highlightColor = data.highlightColor;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    return await prisma.annotation.update({
      where: { id: parseInt(annotationId) },
      data: updateData,
    });
  }

  /**
   * Eliminar anotación
   */
  async deleteAnnotation(annotationId, userId) {
    const annotation = await prisma.annotation.findFirst({
      where: {
        id: parseInt(annotationId),
        userId,
      },
    });

    if (!annotation) {
      throw new Error('Anotación no encontrada');
    }

    await prisma.userBook.update({
      where: { id: annotation.userBookId },
      data: {
        totalAnnotations: { decrement: 1 },
      },
    });

    return await prisma.annotation.delete({
      where: { id: parseInt(annotationId) },
    });
  }

  /**
   * Crear marcador
   */
  async createBookmark(userId, bookId, data) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId),
      },
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    // ✅ CORREGIDO: Agregar userId
    const bookmark = await prisma.bookmark.create({
      data: {
        userId,                              // ✅ AGREGADO
        bookId: parseInt(bookId),
        userBookId: userBook.id,
        chapter: data.chapter,
        page: data.page,
        scrollPosition: data.scrollPosition,
        cfi: data.cfi,
        title: data.title || `Marcador página ${data.page}`,
        note: data.note,
      },
    });

    await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        totalBookmarks: { increment: 1 },
      },
    });

    // Pequeño bonus de XP por marcador
    await this.updateGamificationStats(userId, {
      xpGained: 2,
      reason: 'BOOKMARK_CREATED',
    });

    return bookmark;
  }

  /**
   * Obtener marcadores de un libro
   */
  async getBookBookmarks(userId, bookId) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId),
      },
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    return await prisma.bookmark.findMany({
      where: { userBookId: userBook.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Eliminar marcador
   */
  async deleteBookmark(bookmarkId, userId) {
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: parseInt(bookmarkId),
        userId,
      },
    });

    if (!bookmark) {
      throw new Error('Marcador no encontrado');
    }

    await prisma.userBook.update({
      where: { id: bookmark.userBookId },
      data: {
        totalBookmarks: { decrement: 1 },
      },
    });

    return await prisma.bookmark.delete({
      where: { id: parseInt(bookmarkId) },
    });
  }

  /**
   * Obtener estadísticas de lectura del usuario
   */
  async getUserReadingStats(userId) {
    const [
      totalBooks,
      completedBooks,
      currentlyReading,
      totalAnnotations,
      totalBookmarks,
      readingSessions,
    ] = await Promise.all([
      prisma.userBook.count({
        where: { userId, book: { isDeleted: false } },
      }),
      prisma.userBook.count({
        where: { userId, status: 'COMPLETADO', book: { isDeleted: false } },
      }),
      prisma.userBook.count({
        where: { userId, status: 'LEYENDO', book: { isDeleted: false } },
      }),
      prisma.annotation.count({
        where: { userId },
      }),
      prisma.bookmark.count({
        where: { userId },
      }),
      prisma.readingSession.aggregate({
        where: { userId },
        _sum: {
          pagesRead: true,
          durationMinutes: true,
          pointsEarned: true,
        },
        _count: true,
      }),
    ]);

    return {
      totalBooks,
      completedBooks,
      currentlyReading,
      totalAnnotations,
      totalBookmarks,
      totalPagesRead: readingSessions._sum.pagesRead || 0,
      totalReadingTimeMinutes: readingSessions._sum.durationMinutes || 0,
      totalXPEarned: readingSessions._sum.pointsEarned || 0,
      totalSessions: readingSessions._count,
    };
  }
}

module.exports = new AnnotationService();


/*
const prisma = require('../config/database');
const axios = require('axios');

class AnnotationService {
  /**
   * ✅ CREAR ANOTACIÓN/HIGHLIGHT
   */
  /*
  async createAnnotation(userId, bookId, data) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId),
        book: { isDeleted: false }
      }
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    const annotation = await prisma.annotation.create({
      data: {
        userId,
        bookId: parseInt(bookId),
        userBookId: userBook.id,
        type: data.type || 'HIGHLIGHT',
        chapter: data.chapter,
        page: data.page,
        startOffset: data.startOffset,
        endOffset: data.endOffset,
        selectedText: data.selectedText,
        noteContent: data.noteContent,
        highlightColor: data.highlightColor || '#FFFF00',
        context: data.context,
        cfi: data.cfi,
        isPublic: data.isPublic || false,
        isFavorite: data.isFavorite || false
      }
    });

    // Actualizar contador de anotaciones
    await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        totalAnnotations: { increment: 1 }
      }
    });

    // ✅ GAMIFICACIÓN: Otorgar XP por anotación
    const xpReward = this.calculateAnnotationXP(data.type);
    
    if (xpReward > 0) {
      await this.updateGamificationStats(userId, {
        xpGained: xpReward,
        reason: `ANNOTATION_${data.type}`
      });
      
      await prisma.annotation.update({
        where: { id: annotation.id },
        data: { pointsAwarded: xpReward }
      });
    }

    return annotation;
  }

  /**
   * ✅ CALCULAR XP POR TIPO DE ANOTACIÓN
   */
  /*
  calculateAnnotationXP(type) {
    const xpMap = {
      HIGHLIGHT: 5,
      UNDERLINE: 3,
      NOTE: 10,
      BOOKMARK: 2
    };
    return xpMap[type] || 0;
  }

  /**
   * ✅ REGISTRAR SESIÓN DE LECTURA (Principal función de gamificación)
   */
  /*
  async recordReadingSession(userId, bookId, data) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId)
      },
      include: {
        book: true
      }
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    const pagesRead = data.endPage - data.startPage + 1;
    const durationMinutes = Math.round(
      (new Date(data.endTime) - new Date(data.startTime)) / 60000
    );

    // ✅ Calcular XP: Base + bonos
    const baseXP = pagesRead * 2; // 2 XP por página
    const timeBonus = durationMinutes >= 30 ? 10 : 0; // Bonus por sesión larga
    const focusBonus = durationMinutes >= 60 ? 20 : 0; // Super bonus por 1h+
    const totalXP = baseXP + timeBonus + focusBonus;

    // Crear sesión de lectura
    const session = await prisma.readingSession.create({
      data: {
        userId,
        bookId: parseInt(bookId),
        userBookId: userBook.id,
        startPage: data.startPage,
        endPage: data.endPage,
        pagesRead,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        durationMinutes,
        pointsEarned: totalXP,
        deviceType: data.deviceType
      }
    });

    // Actualizar estadísticas del UserBook
    const progressPercent = userBook.totalPages > 0
      ? ((data.endPage / userBook.totalPages) * 100).toFixed(2)
      : 0;

    await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        currentPage: data.endPage,
        progressPercent: parseFloat(progressPercent),
        totalReadingTimeMinutes: {
          increment: durationMinutes
        },
        lastReadPosition: data.lastReadPosition || `page-${data.endPage}`,
        lastReadAt: new Date(),
        // Si está en QUIERO_LEER, cambiar a LEYENDO
        status: userBook.status === 'QUIERO_LEER' ? 'LEYENDO' : userBook.status,
        startedAt: userBook.startedAt || new Date()
      }
    });

    // ✅ VERIFICAR SI TERMINÓ EL LIBRO
    const bookCompleted = userBook.totalPages && data.endPage >= userBook.totalPages;

    if (bookCompleted && userBook.status !== 'COMPLETADO') {
      await prisma.userBook.update({
        where: { id: userBook.id },
        data: {
          status: 'COMPLETADO',
          finishedAt: new Date()
        }
      });

      // ✅ XP extra por completar libro
      await this.updateGamificationStats(userId, {
        xpGained: totalXP + 50, // +50 XP por terminar libro
        pagesRead,
        minutesRead: durationMinutes,
        booksCompleted: 1,
        reason: 'BOOK_COMPLETED'
      });
    } else {
      // ✅ Actualizar estadísticas normales
      await this.updateGamificationStats(userId, {
        xpGained: totalXP,
        pagesRead,
        minutesRead: durationMinutes,
        reason: 'READING_SESSION'
      });
    }

    return {
      session,
      xpEarned: totalXP,
      bookCompleted
    };
  }

  /**
   * ✅ ACTUALIZAR ESTADÍSTICAS EN GAMIFICATION-SERVICE
   */
  /*
  async updateGamificationStats(userId, data) {
    try {
      const response = await axios.post(
        `${process.env.GAMIFICATION_SERVICE_URL}/api/gamification/stats/update`,
        {
          userId,
          xpGained: data.xpGained || 0,
          pagesRead: data.pagesRead || 0,
          minutesRead: data.minutesRead || 0,
          booksCompleted: data.booksCompleted || 0,
          reason: data.reason
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );

      console.log(`✅ Stats updated for user ${userId}: +${data.xpGained} XP`);
      return response.data;
    } catch (error) {
      console.error('⚠️ Error updating gamification stats:', error.message);
      // No fallar la operación principal si gamification falla
      return null;
    }
  }

  /**
   * ✅ OBTENER ANOTACIONES DE UN LIBRO
   */
  /*
  async getBookAnnotations(userId, bookId, filters = {}) {
    const { type, isFavorite, page } = filters;

    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId)
      }
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    const where = { userBookId: userBook.id };
    if (type) where.type = type;
    if (isFavorite !== undefined) where.isFavorite = isFavorite;
    if (page) where.page = parseInt(page);

    const annotations = await prisma.annotation.findMany({
      where,
      orderBy: [
        { page: 'asc' },
        { startOffset: 'asc' }
      ]
    });

    return annotations;
  }

  /**
   * ✅ ACTUALIZAR ANOTACIÓN
   */
  /*
  async updateAnnotation(annotationId, userId, data) {
    const annotation = await prisma.annotation.findFirst({
      where: {
        id: parseInt(annotationId),
        userId
      }
    });

    if (!annotation) {
      throw new Error('Anotación no encontrada');
    }

    const updateData = {};
    if (data.noteContent !== undefined) updateData.noteContent = data.noteContent;
    if (data.highlightColor !== undefined) updateData.highlightColor = data.highlightColor;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    return await prisma.annotation.update({
      where: { id: parseInt(annotationId) },
      data: updateData
    });
  }

  /**
   * ✅ ELIMINAR ANOTACIÓN
   */
  /*
  async deleteAnnotation(annotationId, userId) {
    const annotation = await prisma.annotation.findFirst({
      where: {
        id: parseInt(annotationId),
        userId
      }
    });

    if (!annotation) {
      throw new Error('Anotación no encontrada');
    }

    await prisma.userBook.update({
      where: { id: annotation.userBookId },
      data: {
        totalAnnotations: { decrement: 1 }
      }
    });

    return await prisma.annotation.delete({
      where: { id: parseInt(annotationId) }
    });
  }

  /**
   * ✅ CREAR MARCADOR
   */
  /*
  async createBookmark(userId, bookId, data) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId)
      }
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        bookId: parseInt(bookId),
        userBookId: userBook.id,
        chapter: data.chapter,
        page: data.page,
        scrollPosition: data.scrollPosition,
        cfi: data.cfi,
        title: data.title || `Marcador página ${data.page}`,
        note: data.note
      }
    });

    await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        totalBookmarks: { increment: 1 }
      }
    });

    // ✅ Pequeño bonus de XP por marcador
    await this.updateGamificationStats(userId, {
      xpGained: 2,
      reason: 'BOOKMARK_CREATED'
    });

    return bookmark;
  }

  /**
   * ✅ OBTENER MARCADORES DE UN LIBRO
   */
  /*
  async getBookBookmarks(userId, bookId) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId)
      }
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    return await prisma.bookmark.findMany({
      where: { userBookId: userBook.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * ✅ ELIMINAR MARCADOR
   */
  /*
  async deleteBookmark(bookmarkId, userId) {
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: parseInt(bookmarkId),
        userId
      }
    });

    if (!bookmark) {
      throw new Error('Marcador no encontrado');
    }

    await prisma.userBook.update({
      where: { id: bookmark.userBookId },
      data: {
        totalBookmarks: { decrement: 1 }
      }
    });

    return await prisma.bookmark.delete({
      where: { id: parseInt(bookmarkId) }
    });
  }

  /**
   * ✅ OBTENER TODAS LAS ANOTACIONES PÚBLICAS DEL USUARIO (para social)
   */
  /*
  async getAllPublicAnnotations(userId) {
    return await prisma.annotation.findMany({
      where: {
        userId,
        isPublic: true
      },
      include: {
        book: {
          select: {
            id: true,
            titulo: true,
            autor: true,
            coverImageUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  /**
   * ✅ OBTENER ESTADÍSTICAS DE LECTURA DEL USUARIO
   */
  /*
  async getUserReadingStats(userId) {
    const [
      totalBooks,
      completedBooks,
      currentlyReading,
      totalAnnotations,
      totalBookmarks,
      readingSessions
    ] = await Promise.all([
      prisma.userBook.count({
        where: { userId, book: { isDeleted: false } }
      }),
      prisma.userBook.count({
        where: { userId, status: 'COMPLETADO', book: { isDeleted: false } }
      }),
      prisma.userBook.count({
        where: { userId, status: 'LEYENDO', book: { isDeleted: false } }
      }),
      prisma.annotation.count({
        where: { userId }
      }),
      prisma.bookmark.count({
        where: { userId }
      }),
      prisma.readingSession.aggregate({
        where: { userId },
        _sum: {
          pagesRead: true,
          durationMinutes: true,
          pointsEarned: true
        },
        _count: true
      })
    ]);

    return {
      totalBooks,
      completedBooks,
      currentlyReading,
      totalAnnotations,
      totalBookmarks,
      totalPagesRead: readingSessions._sum.pagesRead || 0,
      totalReadingTimeMinutes: readingSessions._sum.durationMinutes || 0,
      totalXPEarned: readingSessions._sum.pointsEarned || 0,
      totalSessions: readingSessions._count
    };
  }
}

module.exports = new AnnotationService();
*/