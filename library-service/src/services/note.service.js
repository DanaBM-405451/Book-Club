// library-service/src/services/note.service.js

// library-service/src/services/note.service.js

const prisma = require('../config/database');

class NoteService {
  /**
   * Crear nota
   */
  async createNote(userId, bookId, noteData) {
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
    const note = await prisma.note.create({
      data: {
        userId,                           // ✅ AGREGADO
        bookId: parseInt(bookId),
        userBookId: userBook.id,
        title: noteData.title,
        content: noteData.content,
        page: noteData.page,
        chapter: noteData.chapter,
        type: noteData.type || 'NOTE',
        isPublic: noteData.isPublic || false,
      },
    });

    return note;
  }

  /**
   * Obtener notas de un libro
   */
  async getBookNotes(userId, bookId) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId),
      },
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    const notes = await prisma.note.findMany({
      where: { userBookId: userBook.id },
      orderBy: { createdAt: 'desc' },
    });

    return notes;
  }

  /**
   * Obtener todas las notas del usuario
   */
  async getAllUserNotes(userId, filters = {}) {
    const { type, page = 1, limit = 20 } = filters;

    const where = { userId };
    if (type) where.type = type;

    // ✅ CORREGIDO: Convertir limit a número
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: {
          book: {
            select: {
              id: true,
              titulo: true,
              autor: true,
              coverImageUrl: true,
            },
          },
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,                    // ✅ CORREGIDO: ya es número
        orderBy: { createdAt: 'desc' },
      }),
      prisma.note.count({ where }),
    ]);

    return {
      notes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Obtener nota por ID
   */
  async getNoteById(userId, noteId) {
    const note = await prisma.note.findFirst({
      where: {
        id: parseInt(noteId),
        userId,
      },
      include: {
        book: true,
      },
    });

    if (!note) {
      throw new Error('Nota no encontrada');
    }

    return note;
  }

  /**
   * Actualizar nota
   */
  async updateNote(userId, noteId, updateData) {
    const note = await this.getNoteById(userId, noteId);

    const updatedNote = await prisma.note.update({
      where: { id: parseInt(noteId) },
      data: updateData,
    });

    return updatedNote;
  }

  /**
   * Eliminar nota
   */
  async deleteNote(userId, noteId) {
    const note = await this.getNoteById(userId, noteId);

    await prisma.note.delete({
      where: { id: parseInt(noteId) },
    });

    return { message: 'Nota eliminada correctamente' };
  }
}

module.exports = new NoteService();

/*
const prisma = require('../config/database');

class NoteService {
  /**
   * Crear nota en un libro
   */
  /*
  async createNote(bookId, userId, data) {
    // Verificar que el libro existe y pertenece al usuario
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId,
        deletedAt: null,
      },
    });

    if (!book) {
      const error = new Error('Libro no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Validar que la página no exceda el total (si existe)
    if (data.page && book.totalPages && data.page > book.totalPages) {
      const error = new Error(
        `La página ${data.page} excede el total de páginas del libro (${book.totalPages})`
      );
      error.statusCode = 400;
      throw error;
    }

    const note = await prisma.note.create({
      data: {
        bookId,
        content: data.content,
        page: data.page || null,
        isPrivate: data.isPrivate !== undefined ? data.isPrivate : true,
      },
    });

    return note;
  }

  /**
   * Obtener todas las notas de un libro
   */
  /*
  async getBookNotes(bookId, userId) {
    // Verificar que el libro existe y pertenece al usuario
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId,
        deletedAt: null,
      },
    });

    if (!book) {
      const error = new Error('Libro no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const notes = await prisma.note.findMany({
      where: {
        bookId,
        deletedAt: null,
      },
      orderBy: [
        { page: 'asc' }, // Primero ordenar por página
        { createdAt: 'asc' }, // Luego por fecha de creación
      ],
    });

    return notes;
  }

  /**
   * Obtener nota por ID
   */
  /*
  async getNoteById(noteId, userId) {
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        deletedAt: null,
      },
      include: {
        book: {
          select: {
            id: true,
            userId: true,
            title: true,
          },
        },
      },
    });

    if (!note) {
      const error = new Error('Nota no encontrada');
      error.statusCode = 404;
      throw error;
    }

    // Verificar que la nota pertenece a un libro del usuario
    if (note.book.userId !== userId) {
      const error = new Error('No tienes permiso para acceder a esta nota');
      error.statusCode = 403;
      throw error;
    }

    return note;
  }

  /**
   * Actualizar nota
   */
  /*
  async updateNote(noteId, userId, data) {
    const note = await this.getNoteById(noteId, userId);

    const updateData = {};

    if (data.content !== undefined) updateData.content = data.content;
    if (data.page !== undefined) updateData.page = data.page;
    if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

    // Si se actualiza la página, validar contra totalPages del libro
    if (data.page) {
      const book = await prisma.book.findUnique({
        where: { id: note.bookId },
        select: { totalPages: true },
      });

      if (book.totalPages && data.page > book.totalPages) {
        const error = new Error(
          `La página ${data.page} excede el total de páginas del libro (${book.totalPages})`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: updateData,
    });

    return updatedNote;
  }

  /**
   * Eliminar nota (soft delete)
   */
  /*
  async deleteNote(noteId, userId) {
    await this.getNoteById(noteId, userId);

    const note = await prisma.note.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });

    return note;
  }

  /**
   * Obtener todas las notas del usuario (de todos sus libros)
   */
  /*
  async getAllUserNotes(userId, filters = {}) {
    const { page = 1, limit = 50 } = filters;

    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      book: {
        userId,
        deletedAt: null,
      },
    };

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.note.count({ where }),
    ]);

    return {
      notes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new NoteService();
*/