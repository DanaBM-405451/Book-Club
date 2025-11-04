// library-service/src/controllers/annotation.controller.js

const annotationService = require('../services/annotation.service');

class AnnotationController {
  async createAnnotation(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { bookId } = req.params;

      console.log('🎨 Creating annotation - userId:', userId);

      const annotation = await annotationService.createAnnotation(userId, bookId, req.body);

      res.status(201).json({
        success: true,
        message: 'Anotación creada',
        data: { annotation },
      });
    } catch (error) {
      next(error);
    }
  }

  async recordReadingSession(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { bookId } = req.params;

      const result = await annotationService.recordReadingSession(userId, bookId, req.body);

      res.json({
        success: true,
        message: 'Sesión de lectura registrada',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookAnnotations(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { bookId } = req.params;
      const filters = {
        type: req.query.type,
        isFavorite: req.query.isFavorite,
        page: req.query.page,
      };

      const annotations = await annotationService.getBookAnnotations(userId, bookId, filters);

      res.json({
        success: true,
        data: { annotations },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAnnotation(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { id } = req.params;

      const annotation = await annotationService.updateAnnotation(id, userId, req.body);

      res.json({
        success: true,
        message: 'Anotación actualizada',
        data: { annotation },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAnnotation(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { id } = req.params;

      await annotationService.deleteAnnotation(id, userId);

      res.json({
        success: true,
        message: 'Anotación eliminada',
      });
    } catch (error) {
      next(error);
    }
  }

  async createBookmark(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { bookId } = req.params;

      const bookmark = await annotationService.createBookmark(userId, bookId, req.body);

      res.status(201).json({
        success: true,
        message: 'Marcador creado',
        data: { bookmark },
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookBookmarks(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { bookId } = req.params;

      const bookmarks = await annotationService.getBookBookmarks(userId, bookId);

      res.json({
        success: true,
        data: { bookmarks },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBookmark(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { id } = req.params;

      await annotationService.deleteBookmark(id, userId);

      res.json({
        success: true,
        message: 'Marcador eliminado',
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserReadingStats(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const stats = await annotationService.getUserReadingStats(userId);

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnnotationController();

/*const annotationService = require('../services/annotation.service');

class AnnotationController {
  /**
   * POST /api/library/books/:bookId/annotations
   */
  /*
  async createAnnotation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookId } = req.params;

      const annotation = await annotationService.createAnnotation(userId, bookId, req.body);

      res.status(201).json({
        success: true,
        message: 'Anotación creada exitosamente',
        data: { annotation }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/library/books/:bookId/annotations
   */
  /*
  async getBookAnnotations(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookId } = req.params;
      const filters = {
        type: req.query.type,
        isFavorite: req.query.isFavorite === 'true',
        page: req.query.page
      };

      const annotations = await annotationService.getBookAnnotations(userId, bookId, filters);

      res.json({
        success: true,
        data: { annotations }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/library/annotations/:id
   */
  /*
  async updateAnnotation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const annotation = await annotationService.updateAnnotation(id, userId, req.body);

      res.json({
        success: true,
        message: 'Anotación actualizada',
        data: { annotation }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/library/annotations/:id
   */
  /*
  async deleteAnnotation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      await annotationService.deleteAnnotation(id, userId);

      res.json({
        success: true,
        message: 'Anotación eliminada'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/library/books/:bookId/bookmarks
   */
  /*
  async createBookmark(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookId } = req.params;

      const bookmark = await annotationService.createBookmark(userId, bookId, req.body);

      res.status(201).json({
        success: true,
        message: 'Marcador creado',
        data: { bookmark }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/library/books/:bookId/bookmarks
   */
  /*
  async getBookBookmarks(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookId } = req.params;

      const bookmarks = await annotationService.getBookBookmarks(userId, bookId);

      res.json({
        success: true,
        data: { bookmarks }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/library/books/:bookId/reading-session
   */
  /*
  async recordReadingSession(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookId } = req.params;

      const session = await annotationService.recordReadingSession(userId, bookId, req.body);

      res.status(201).json({
        success: true,
        message: 'Sesión de lectura registrada',
        data: { session }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnnotationController();
*/