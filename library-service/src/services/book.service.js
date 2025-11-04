// library-service/src/services/book.service.js

const prisma = require('../config/database');

class BookService {
  /**
   * Crear nuevo libro y agregarlo a la biblioteca del usuario
   */

 /**
   * Crear nuevo libro
   */
  async createBook(userId, bookData) {
    let coverImageUrl = bookData.coverImageUrl;
    let pdfFileUrl = null;
    let epubFileUrl = null;

    // Subir portada a Cloudinary si es base64
    if (bookData.coverImageUrl && bookData.coverImageUrl.startsWith('data:image')) {
      console.log('📤 Uploading book cover to Cloudinary...');
      // Generar ID temporal para el libro
      const tempBookId = `temp_${Date.now()}`;
      coverImageUrl = await uploadBookCover(bookData.coverImageUrl, tempBookId);
    }

    // Subir archivo PDF/EPUB a Cloudinary si existe
    if (bookData.fileData && bookData.fileType) {
      console.log(`📤 Uploading ${bookData.fileType} file to Cloudinary...`);
      const tempBookId = `temp_${Date.now()}`;
      const fileUrl = await uploadBookFile(bookData.fileData, tempBookId, bookData.fileType);

      if (bookData.fileType === 'PDF') {
        pdfFileUrl = fileUrl;
      } else if (bookData.fileType === 'EPUB') {
        epubFileUrl = fileUrl;
      }
    }

    // Crear libro en BD
    const book = await prisma.book.create({
      data: {
        titulo: bookData.titulo,
        subtitulo: bookData.subtitulo,
        autor: bookData.autor,
        descripcion: bookData.descripcion,
        pageCount: bookData.pageCount,
        categorias: bookData.categorias,
        idioma: bookData.idioma || 'es',
        isbn10: bookData.isbn10,
        isbn13: bookData.isbn13,
        coverImageUrl: coverImageUrl,
        publicacion: bookData.publicacion,
        fechaPublicacion: bookData.fechaPublicacion,
        source: bookData.source || 'MANUAL',
        googleBookId: bookData.googleBookId,
        pdfFileUrl: pdfFileUrl,
        epubFileUrl: epubFileUrl,
        uploadedByUserId: userId,
      },
    });

    console.log('✅ Book created with ID:', book.id);

    // Crear UserBook
    const userBook = await prisma.userBook.create({
      data: {
        userId,
        bookId: book.id,
        totalPages: bookData.pageCount || 0,
        status: bookData.shelf || 'QUIERO_LEER',
      },
    });

    return { book, userBook };
  }


  async createBook(userId, bookData) {
    // Crear libro
    const book = await prisma.book.create({
      data: {
        titulo: bookData.titulo,
        subtitulo: bookData.subtitulo,
        autor: bookData.autor,
        descripcion: bookData.descripcion,
        pageCount: bookData.pageCount,
        categorias: bookData.categorias,
        idioma: bookData.idioma || 'es',
        isbn10: bookData.isbn10,
        isbn13: bookData.isbn13,
        coverImageUrl: bookData.coverImageUrl,
        publicacion: bookData.publicacion,
        fechaPublicacion: bookData.fechaPublicacion,
        source: bookData.source || 'MANUAL',
        uploadedByUserId: userId,
      },
    });

    // ✅ CORREGIDO: Agregar userId
    const userBook = await prisma.userBook.create({
      data: {
        userId,                              // ✅ AGREGADO
        bookId: book.id,
        totalPages: bookData.pageCount || 0,
        status: bookData.shelf || 'QUIERO_LEER',
      },
    });

    return { book, userBook };
  }

  /**
   * Obtener libros del usuario con filtros
   */
  async getUserBooks(userId, filters = {}) {
    const { search, shelf, page = 1, limit = 20 } = filters;

    const where = {
      userId,
      book: {
        isDeleted: false,
      },
    };

    if (shelf) {
      where.status = shelf;
    }

    if (search) {
      where.book = {
        ...where.book,
        OR: [
          { titulo: { contains: search } },
          { autor: { contains: search } },
        ],
      };
    }

    const [userBooks, total] = await Promise.all([
      prisma.userBook.findMany({
        where,
        include: {
          book: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          addedAt: 'desc',
        },
      }),
      prisma.userBook.count({ where }),
    ]);

    return {
      userBooks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un libro específico del usuario
   */
  async getUserBook(userId, bookId) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: parseInt(bookId),
        book: {
          isDeleted: false,
        },
      },
      include: {
        book: true,
      },
    });

    if (!userBook) {
      throw new Error('Libro no encontrado');
    }

    return userBook;
  }

  /**
   * Actualizar libro
   */
  async updateBook(userId, bookId, updateData) {
    const userBook = await this.getUserBook(userId, bookId);

    const updatedBook = await prisma.book.update({
      where: { id: parseInt(bookId) },
      data: updateData,
    });

    return updatedBook;
  }

  /**
   * Eliminar libro (soft delete)
   */
  async deleteBook(userId, bookId) {
    const userBook = await this.getUserBook(userId, bookId);

    await prisma.book.update({
      where: { id: parseInt(bookId) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: 'Libro eliminado correctamente' };
  }

  /**
   * Calificar libro
   */
  async rateBook(userId, bookId, rating) {
    const userBook = await this.getUserBook(userId, bookId);

    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBook.id },
      data: { rating: parseFloat(rating) },
    });

    return updatedUserBook;
  }

  /**
   * Actualizar progreso de lectura
   */
  async updateProgress(userId, bookId, currentPage) {
    const userBook = await this.getUserBook(userId, bookId);

    const progressPercent =
      userBook.totalPages > 0
        ? ((currentPage / userBook.totalPages) * 100).toFixed(2)
        : 0;

    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        currentPage: parseInt(currentPage),
        progressPercent: parseFloat(progressPercent),
        lastReadAt: new Date(),
        status:
          currentPage >= userBook.totalPages ? 'COMPLETADO' : userBook.status,
        finishedAt:
          currentPage >= userBook.totalPages ? new Date() : userBook.finishedAt,
      },
    });

    return updatedUserBook;
  }

  /**
   * Cambiar estante
   */
  async changeShelf(userId, bookId, shelf) {
    const userBook = await this.getUserBook(userId, bookId);

    // ✅ CORREGIDO: Validar que shelf sea un valor válido del enum
    const validShelves = ['QUIERO_LEER', 'LEYENDO', 'COMPLETADO', 'EN_ESPERA', 'ABANDONADO'];
    
    if (!validShelves.includes(shelf)) {
      throw new Error(`Estante inválido. Valores válidos: ${validShelves.join(', ')}`);
    }

    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        status: shelf,
        startedAt: shelf === 'LEYENDO' && !userBook.startedAt ? new Date() : userBook.startedAt,
        finishedAt: shelf === 'COMPLETADO' ? new Date() : null,
      },
    });

    return updatedUserBook;
  }

  /**
   * Gestionar tags
   */
  async manageTags(userId, bookId, tags) {
    const userBook = await this.getUserBook(userId, bookId);

    const tagsString = Array.isArray(tags) ? tags.join(',') : tags;

    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBook.id },
      data: { tags: tagsString },
    });

    return updatedUserBook;
  }

  /**
   * Obtener estadísticas de la biblioteca
   */
  async getLibraryStats(userId) {
    const [totalBooks, byShelf, totalPagesRead, totalReadingTime] = await Promise.all([
      prisma.userBook.count({
        where: { userId, book: { isDeleted: false } },
      }),
      prisma.userBook.groupBy({
        by: ['status'],
        where: { userId, book: { isDeleted: false } },
        _count: true,
      }),
      prisma.userBook.aggregate({
        where: { userId, book: { isDeleted: false } },
        _sum: { currentPage: true },
      }),
      prisma.userBook.aggregate({
        where: { userId, book: { isDeleted: false } },
        _sum: { totalReadingTimeMinutes: true },
      }),
    ]);

    const shelfStats = byShelf.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count;
      return acc;
    }, {});

    return {
      totalBooks,
      byShelf: {
        quieroLeer: shelfStats.quiero_leer || 0,
        leyendo: shelfStats.leyendo || 0,
        completado: shelfStats.completado || 0,
        enEspera: shelfStats.en_espera || 0,
        abandonado: shelfStats.abandonado || 0,
      },
      totalPagesRead: totalPagesRead._sum.currentPage || 0,
      totalReadingTimeMinutes: totalReadingTime._sum.totalReadingTimeMinutes || 0,
    };
  }
}

module.exports = new BookService();

/*
const prisma = require('../config/database.js');
const { 
  uploadPDFToCloudinary, 
  uploadCoverToCloudinary, 
  deleteFromCloudinary 
} = require('../utils/cloudinary.utils.js');

class BookService {
  /**
   * Crear nuevo libro
   */
  /*
  async createBook(userId, data) {
    const book = await prisma.book.create({
      data: {
        userId,
        titulo: data.titulo,
        autor: data.autor || null,
        isbn: data.isbn || null,
        description: data.description || null,
        totalPages: data.totalPages || null,
        publishedDate: data.publishedDate ? new Date(data.publishedDate) : null,
        language: data.language || null,
        publisher: data.publisher || null,
        shelf: data.shelf || 'WISHLIST',
      },
      include: {
        tags: true,
      },
    });

    return book;
  }

  /**
   * Obtener todos los libros del usuario con filtros
   */
  /*
  async getUserBooks(userId, filters = {}) {
    const { search, shelf, tags, page = 1, limit = 20 } = filters;

    const where = {
      userId,
      deletedAt: null, // Solo libros no eliminados
    };

    // Filtro por estante
    if (shelf) {
      where.shelf = shelf;
    }

    // Búsqueda por título, autor o ISBN
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search } },
      ];
    }

    // Filtro por tags
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          name: {
            in: tags,
          },
        },
      };
    }

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        include: {
          tags: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      prisma.book.count({ where }),
    ]);

    return {
      books,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener libro por ID
   */
  /*
  async getBookById(bookId, userId) {
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId,
        deletedAt: null,
      },
      include: {
        tags: true,
        notes: {
          where: { deletedAt: null },
          orderBy: { page: 'asc' },
        },
      },
    });

    if (!book) {
      const error = new Error('Libro no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return book;
  }

  /**
   * Actualizar libro
   */
  /*
  async updateBook(bookId, userId, data) {
    // Verificar que el libro existe y pertenece al usuario
    await this.getBookById(bookId, userId);

    const updateData = {};

    // Solo actualizar campos enviados
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.autor !== undefined) updateData.autor = data.autor;
    if (data.isbn !== undefined) updateData.isbn = data.isbn;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.totalPages !== undefined) updateData.totalPages = data.totalPages;
    if (data.currentPage !== undefined) updateData.currentPage = data.currentPage;
    if (data.publishedDate !== undefined) {
      updateData.publishedDate = data.publishedDate ? new Date(data.publishedDate) : null;
    }
    if (data.language !== undefined) updateData.language = data.language;
    if (data.publisher !== undefined) updateData.publisher = data.publisher;
    if (data.shelf !== undefined) updateData.shelf = data.shelf;

    const book = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
      include: {
        tags: true,
      },
    });

    return book;
  }

  /**
   * Eliminar libro (soft delete)
   */
  /*
  async deleteBook(bookId, userId) {
    // Verificar que el libro existe y pertenece al usuario
    await this.getBookById(bookId, userId);

    const book = await prisma.book.update({
      where: { id: bookId },
      data: { deletedAt: new Date() },
    });

    return book;
  }

  /**
   * Calificar libro (rating con estrellas)
   */
  /*
  async rateBook(bookId, userId, rating) {
    // Verificar que el libro existe y pertenece al usuario
    await this.getBookById(bookId, userId);

    const book = await prisma.book.update({
      where: { id: bookId },
      data: { rating },
      include: { tags: true },
    });

    return book;
  }

  /**
   * Actualizar progreso de lectura
   */
  /*
  async updateProgress(bookId, userId, currentPage) {
    const book = await this.getBookById(bookId, userId);

    // Validar que currentPage no exceda totalPages
    if (book.totalPages && currentPage > book.totalPages) {
      const error = new Error(`La página actual (${currentPage}) no puede exceder el total de páginas (${book.totalPages})`);
      error.statusCode = 400;
      throw error;
    }

    const updateData = { currentPage };

    // Si llegó a la última página, mover a FINISHED
    if (book.totalPages && currentPage >= book.totalPages) {
      updateData.shelf = 'FINISHED';
      updateData.finishedAt = new Date();
    } else if (book.shelf === 'WISHLIST') {
      // Si está en wishlist y empieza a leer, mover a IN_PROGRESS
      updateData.shelf = 'IN_PROGRESS';
    }

    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
      include: { tags: true },
    });

    return updatedBook;
  }

  /**
   * Cambiar estante
   */
  /*
  async changeShelf(bookId, userId, shelf) {
    await this.getBookById(bookId, userId);

    const updateData = { shelf };

    // Si cambia a FINISHED, registrar fecha
    if (shelf === 'FINISHED') {
      updateData.finishedAt = new Date();
    }

    const book = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
      include: { tags: true },
    });

    return book;
  }

  /**
   * Subir PDF del libro
   */
  /*
  async uploadPDF(bookId, userId, file) {
    const book = await this.getBookById(bookId, userId);

    // Si ya tenía un PDF, eliminarlo de Cloudinary
    if (book.pdfPublicId) {
      await deleteFromCloudinary(book.pdfPublicId, 'raw');
    }

    // Subir nuevo PDF
    const { url, publicId, bytes } = await uploadPDFToCloudinary(file.buffer, file.originalname);

    // Actualizar en BD
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        pdfUrl: url,
        pdfPublicId: publicId,
        pdfFileName: file.originalname,
        pdfFileSize: bytes,
      },
      include: { tags: true },
    });

    return updatedBook;
  }

  /**
   * Subir portada del libro
   */
  /*
  async uploadCover(bookId, userId, file) {
    const book = await this.getBookById(bookId, userId);

    // Si ya tenía una portada, eliminarla de Cloudinary
    if (book.coverPublicId) {
      await deleteFromCloudinary(book.coverPublicId, 'image');
    }

    // Subir nueva portada
    const { url, publicId } = await uploadCoverToCloudinary(file.buffer);

    // Actualizar en BD
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        coverUrl: url,
        coverPublicId: publicId,
      },
      include: { tags: true },
    });

    return updatedBook;
  }

  /**
   * Gestionar tags de un libro
   */
  /*
  async manageTags(bookId, userId, tagNames) {
    await this.getBookById(bookId, userId);

    // Crear tags que no existan
    const tagPromises = tagNames.map(async (name) => {
      return await prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    });

    const tags = await Promise.all(tagPromises);

    // Conectar tags al libro (reemplaza los anteriores)
    const book = await prisma.book.update({
      where: { id: bookId },
      data: {
        tags: {
          set: tags.map((tag) => ({ id: tag.id })),
        },
      },
      include: { tags: true },
    });

    return book;
  }

  /**
   * Obtener estadísticas de biblioteca
   */
  /*
  async getStats(userId) {
    const [wishlist, inProgress, finished, totalBooks] = await Promise.all([
      prisma.book.count({
        where: { userId, shelf: 'WISHLIST', deletedAt: null },
      }),
      prisma.book.count({
        where: { userId, shelf: 'IN_PROGRESS', deletedAt: null },
      }),
      prisma.book.count({
        where: { userId, shelf: 'FINISHED', deletedAt: null },
      }),
      prisma.book.count({
        where: { userId, deletedAt: null },
      }),
    ]);

    // Calcular total de páginas leídas
    const booksWithPages = await prisma.book.findMany({
      where: { userId, deletedAt: null },
      select: { currentPage: true, totalPages: true },
    });

    const totalPagesRead = booksWithPages.reduce((sum, book) => {
      return sum + (book.currentPage || 0);
    }, 0);

    return {
      totalBooks,
      byShelf: {
        wishlist,
        inProgress,
        finished,
      },
      totalPagesRead,
    };
  }
}

module.exports = new BookService();
*/