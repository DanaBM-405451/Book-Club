// library-service/src/controllers/note.controller.js

const noteService = require('../services/note.service');

class NoteController {
  async createNote(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { bookId } = req.params;

      console.log('📝 Creating note - userId:', userId);

      const note = await noteService.createNote(userId, bookId, req.body);

      res.status(201).json({
        success: true,
        message: 'Nota creada',
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookNotes(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { bookId } = req.params;

      const notes = await noteService.getBookNotes(userId, bookId);

      res.json({
        success: true,
        data: { notes },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUserNotes(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const filters = {
        type: req.query.type,
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await noteService.getAllUserNotes(userId, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getNoteById(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { id } = req.params;

      const note = await noteService.getNoteById(userId, id);

      res.json({
        success: true,
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { id } = req.params;

      const note = await noteService.updateNote(userId, id, req.body);

      res.json({
        success: true,
        message: 'Nota actualizada',
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const { id } = req.params;

      await noteService.deleteNote(userId, id);

      res.json({
        success: true,
        message: 'Nota eliminada',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NoteController();

/*
const noteService = require('../services/note.service');

class NoteController {
  /**
   * Crear nota en un libro
   */
  /*
  async createNote(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.bookId;

      const note = await noteService.createNote(bookId, userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Nota creada exitosamente',
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todas las notas de un libro
   */
  /*
  async getBookNotes(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookId = req.params.bookId;

      const notes = await noteService.getBookNotes(bookId, userId);

      res.status(200).json({
        success: true,
        data: { notes },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener nota por ID
   */
  /*
  async getNoteById(req, res, next) {
    try {
      const userId = req.user.userId;
      const noteId = req.params.id;

      const note = await noteService.getNoteById(noteId, userId);

      res.status(200).json({
        success: true,
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar nota
   */
  /*
  async updateNote(req, res, next) {
    try {
      const userId = req.user.userId;
      const noteId = req.params.id;

      const note = await noteService.updateNote(noteId, userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Nota actualizada exitosamente',
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar nota
   */
  /*
  async deleteNote(req, res, next) {
    try {
      const userId = req.user.userId;
      const noteId = req.params.id;

      await noteService.deleteNote(noteId, userId);

      res.status(200).json({
        success: true,
        message: 'Nota eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todas las notas del usuario
   */
  /*
  async getAllUserNotes(req, res, next) {
    try {
      const userId = req.user.userId;
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await noteService.getAllUserNotes(userId, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NoteController();
*/