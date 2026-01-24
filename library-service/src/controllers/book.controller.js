// library-service/src/controllers/book.controller.js

const bookService = require('../services/book.service');

class BookController {

  // 1. Crear Libro
  async createBook(req, res, next) {
    try {
      const userId = req.user.id;
      const files = req.files || {};
      const result = await bookService.createBook(userId, req.body, files);
      res.status(201).json({ success: true, message: 'Libro creado', data: result });
    } catch (error) {
      next(error);
    }
  }

  // 2. Obtener libros
  async getUserBooks(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const result = await bookService.getUserBooks(userId, req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // 3. Obtener un libro
  async getUserBook(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const userBook = await bookService.getUserBook(userId, req.params.id);
      res.json({ success: true, data: { userBook } });
    } catch (error) {
      next(error);
    }
  }

  // 4. Actualizar libro
  async updateBook(req, res, next) {
    try {
      console.log("🔍 DEBUG CONTROLLER - Archivos recibidos:", req.files); 
      console.log("🔍 [DIAGNÓSTICO] Headers Content-Type:", req.headers['content-type']);
      console.log("🔍 [DIAGNÓSTICO] Files:", req.files);
      const userId = req.user.userId || req.user.id;
      const files = req.files || {};
      const book = await bookService.updateBook(userId, req.params.id, req.body, files);
      res.json({ success: true, message: 'Actualizado', data: { userBook: book } });
    } catch (error) {
      next(error);
    }
  }
  
  // 5. Eliminar
  async deleteBook(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      await bookService.deleteBook(userId, req.params.id);
      res.json({ success: true, message: 'Eliminado' });
    } catch (error) {
      next(error);
    }
  }

  // 6. Calificar
  async rateBook(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const userBook = await bookService.rateBook(userId, req.params.id, req.body.rating);
      res.json({ success: true, message: 'Calificación guardada', data: { userBook } });
    } catch (error) {
      next(error);
    }
  }

  
 async updateProgress(req, res, next) {
    try {
      // ✅ AHORA RECIBIMOS 'lastReadPosition' (El CFI del EPUB)
      const { currentPage, durationMinutes, pagesRead, lastReadPosition } = req.body; 
      const { id } = req.params;
      const userId = req.user.userId || req.user.id; // Aseguramos compatibilidad de ID

      // Pasamos todos los datos al servicio
      const result = await bookService.updateProgress(
          userId, 
          id, 
          currentPage,      // Número entero (para la barra %)
          durationMinutes, 
          pagesRead,        // Delta para gamificación
          lastReadPosition  // String CFI (para volver al punto exacto)
      );

      res.json({ success: true, data: { userBook: result } });
    } catch (error) {
      next(error);
    }
  }

  // 8. Cambiar estante
  async changeShelf(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const userBook = await bookService.changeShelf(userId, req.params.id, req.body.shelf);
      res.json({ success: true, message: 'Estante actualizado', data: { userBook } });
    } catch (error) {
      next(error);
    }
  }

  // 9. Tags
  async manageTags(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const userBook = await bookService.manageTags(userId, req.params.id, req.body.tags);
      res.json({ success: true, message: 'Tags actualizados', data: { userBook } });
    } catch (error) {
      next(error);
    }
  }

  // 10. Stats Usuario
  async getLibraryStats(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const stats = await bookService.getLibraryStats(userId);
      res.json({ success: true, data: { stats } });
    } catch (error) {
      next(error);
    }
  }

  // 11. Stats Admin
  async getAdminStats(req, res, next) {
    try {
      const { startDate, endDate, genre } = req.query;
      const stats = await bookService.getGlobalLibraryStats({ startDate, endDate, genre });
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookController();
/*
const bookService = require('../services/book.service');

class BookController {
  /**
   * Crear nuevo libro
   */
  /*
  async createBook(req, res, next) {
    try {
      const userId = req.user.userId;
      const book = await bookService.createBook(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Libro creado exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener libros del usuario con filtros
   */
  /*
  async getUserBooks(req, res, next) {
    try {
      const userId = req.user.userId;
      const filters = {
        search: req.query.search,
        shelf: req.query.shelf,
        tags: req.query.tags ? req.query.tags.split(',') : undefined,
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await bookService.getUserBooks(userId, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener libro por ID
   */
  /*
  async getBookById(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.id;

      const book = await bookService.getBookById(bookId, userId);

      res.status(200).json({
        success: true,
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar libro
   */
  /*
  async updateBook(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.id;

      const book = await bookService.updateBook(bookId, userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Libro actualizado exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar libro (soft delete)
   */
  /*
  async deleteBook(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.id;

      await bookService.deleteBook(bookId, userId);

      res.status(200).json({
        success: true,
        message: 'Libro eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calificar libro
   */
  /*
  async rateBook(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.id;
      const { rating } = req.body;

      const book = await bookService.rateBook(bookId, userId, rating);

      res.status(200).json({
        success: true,
        message: 'Calificación guardada exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar progreso de lectura
   */
  /*
  async updateProgress(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.id;
      const { currentPage } = req.body;

      const book = await bookService.updateProgress(bookId, userId, currentPage);

      res.status(200).json({
        success: true,
        message: 'Progreso actualizado exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cambiar estante
   */
  /*
  async changeShelf(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.id;
      const { shelf } = req.body;

      const book = await bookService.changeShelf(bookId, userId, shelf);

      res.status(200).json({
        success: true,
        message: 'Estante actualizado exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Subir PDF
   */
 /* async uploadPDF(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo PDF',
        });
      }

      const userId = req.user.userId;
      const bookId = req.params.id;

      const book = await bookService.uploadPDF(bookId, userId, req.file);

      res.status(200).json({
        success: true,
        message: 'PDF subido exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }*/

   /**
   * SUBIR PDF
   */
  /*
  async uploadPDF(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo PDF',
        });
      }

      const userId = req.user.userId;
      const bookId = req.params.id;

      const book = await bookService.uploadPDF(bookId, userId, req.file);

      res.status(200).json({
        success: true,
        message: 'PDF subido exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   *  SUBIR EPUB
   */
  /*
  async uploadEPUB(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo EPUB',
        });
      }

      const userId = req.user.userId;
      const bookId = req.params.id;

      const book = await bookService.uploadEPUB(bookId, userId, req.file);

      res.status(200).json({
        success: true,
        message: 'EPUB subido exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * SUBIR PORTADA
   */
  /*
  async uploadCover(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ninguna imagen',
        });
      }

      const userId = req.user.userId;
      const bookId = req.params.id;

      const book = await bookService.uploadCover(bookId, userId, req.file);

      res.status(200).json({
        success: true,
        message: 'Portada subida exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ✅ NUEVO: ELIMINAR PDF
   */
  /*
  async deletePDF(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.id;

      await bookService.deletePDF(bookId, userId);

      res.status(200).json({
        success: true,
        message: 'PDF eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   *  ELIMINAR EPUB
   */
  /*
  async deleteEPUB(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.id;

      await bookService.deleteEPUB(bookId, userId);

      res.status(200).json({
        success: true,
        message: 'EPUB eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Subir portada
   */
  /*
  async uploadCover(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ninguna imagen',
        });
      }

      const userId = req.user.userId;
      const bookId = req.params.id;

      const book = await bookService.uploadCover(bookId, userId, req.file);

      res.status(200).json({
        success: true,
        message: 'Portada subida exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gestionar tags
   */
  /*
  async manageTags(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.id;
      const { tags } = req.body;

      if (!Array.isArray(tags)) {
        return res.status(400).json({
          success: false,
          message: 'Tags debe ser un array',
        });
      }

      const book = await bookService.manageTags(bookId, userId, tags);

      res.status(200).json({
        success: true,
        message: 'Tags actualizados exitosamente',
        data: { book },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas
   */
  /*
  async getStats(req, res, next) {
    try {
      const userId = req.user.userId;
      const stats = await bookService.getStats(userId);

      res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookController();

*/