// library-service/src/services/book.service.js
// library-service/src/services/book.service.js

const prisma = require('../config/database');
const { uploadBookCover, uploadBookFile } = require('../utils/cloudinary.utils');
const axios = require('axios'); // ✅ Necesario para comunicar servicios

class BookService {
  
  // --- MÉTODO PRIVADO: Notificar a Gamification Service ---
  async _notifyGamificationBookFinished(userId, bookId) {
    try {
      // Ajusta la URL al puerto de tu gamification-service
      const gamificationUrl = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004';
      
      console.log(`🎉 Notificando libro terminado: ${bookId} para usuario ${userId}`);
      
      await axios.post(`${gamificationUrl}/api/gamification/stats/update`, {
        userId,
        booksCompleted: 1, // Sumamos 1 libro
        xpGained: 50,      // Bonus por terminar libro
        reason: 'Libro completado'
      });
      
    } catch (error) {
      console.error('❌ Error notificando a Gamification:', error.message);
      // No lanzamos error para no bloquear la respuesta al usuario
    }
  }

  /**
   * Crear nuevo libro y agregarlo a la biblioteca
   */
  async createBook(userId, bookData, files = {}) {
    // ... (Tu lógica de createBook existente se mantiene igual, simplificada aquí) ...
    
    // Validaciones...
    if (!bookData.titulo) throw new Error('Título requerido');
    
    let coverImageUrl = null;
    let pdfFileUrl = null;
    let epubFileUrl = null;

    if (files.cover && files.cover[0]) {
      const tempId = `temp_${Date.now()}`;
      coverImageUrl = await uploadBookCover(files.cover[0].buffer, tempId);
    }

    const book = await prisma.book.create({
      data: {
        titulo: bookData.titulo,
        autor: bookData.autor,
        descripcion: bookData.descripcion,
        pageCount: bookData.pageCount ? parseInt(bookData.pageCount) : null,
        categorias: bookData.categorias,
        idioma: bookData.idioma || 'es',
        isbn10: bookData.isbn10,
        isbn13: bookData.isbn13,
        coverImageUrl: coverImageUrl,
        publicacion: bookData.publicacion,
        fechaPublicacion: bookData.fechaPublicacion,
        source: bookData.source || 'MANUAL',
        googleBookId: bookData.googleBookId,
        uploadedByUserId: userId,
        isPublic: true,
        isDeleted: false,
      },
    });

    // Subida de archivos (simplificada por brevedad, tu lógica original estaba bien)
    if (files.pdf && files.pdf[0]) {
        pdfFileUrl = await uploadBookFile(files.pdf[0].buffer, book.id, 'pdf');
        await prisma.book.update({ where: { id: book.id }, data: { pdfFileUrl } });
    }
    if (files.epub && files.epub[0]) {
        epubFileUrl = await uploadBookFile(files.epub[0].buffer, book.id, 'epub');
        await prisma.book.update({ where: { id: book.id }, data: { epubFileUrl } });
    }

    const userBook = await prisma.userBook.create({
      data: {
        userId,
        bookId: book.id,
        totalPages: book.pageCount || 0,
        status: bookData.shelf || 'QUIERO_LEER',
      },
    });

    // Si se crea directamente como completado (raro pero posible)
    if (userBook.status === 'COMPLETADO') {
        this._notifyGamificationBookFinished(userId, book.id);
    }

    return { book, userBook };
  }

  async getUserBooks(userId, filters = {}) {
    const { search, shelf, page = 1, limit = 20 } = filters;
    const where = { userId, book: { isDeleted: false } };

    if (shelf) where.status = shelf;
    if (search) {
      where.book = {
        ...where.book,
        OR: [{ titulo: { contains: search } }, { autor: { contains: search } }],
      };
    }

    const [userBooks, total] = await Promise.all([
      prisma.userBook.findMany({
        where,
        include: { book: true },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { addedAt: 'desc' },
      }),
      prisma.userBook.count({ where }),
    ]);

    return { userBooks, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } };
  }

  async getUserBook(userId, bookId) {
    const userBook = await prisma.userBook.findFirst({
      where: { userId, bookId: parseInt(bookId), book: { isDeleted: false } },
      include: { book: true },
    });
    if (!userBook) throw new Error('Libro no encontrado');
    return userBook;
  }

  /**
   * Actualizar libro (Edición general)
   */
  async updateBook(userId, bookId, data, files = {}) {
    const userBook = await this.getUserBook(userId, bookId);
    const wasCompleted = userBook.status === 'COMPLETADO';

    // 1. Actualizar datos del libro (Tabla Book)
    let coverImageUrl = undefined;
    if (files.cover && files.cover[0]) {
      const tempId = `book_${bookId}_${Date.now()}`;
      coverImageUrl = await uploadBookCover(files.cover[0].buffer, tempId);
    }

    const bookUpdateData = {};
    if (data.titulo) bookUpdateData.titulo = data.titulo.trim();
    if (data.autor) bookUpdateData.autor = data.autor.trim();
    if (data.descripcion) bookUpdateData.descripcion = data.descripcion.trim();
    if (coverImageUrl) bookUpdateData.coverImageUrl = coverImageUrl;

    if (Object.keys(bookUpdateData).length > 0) {
      await prisma.book.update({ where: { id: parseInt(bookId) }, data: bookUpdateData });
    }

    // 2. Actualizar estado de usuario (Tabla UserBook)
    const userBookUpdateData = {};
    let isJustFinished = false;

    if (data.status) {
       const validShelves = ['QUIERO_LEER', 'LEYENDO', 'COMPLETADO', 'EN_ESPERA', 'ABANDONADO'];
       if (validShelves.includes(data.status)) {
         userBookUpdateData.status = data.status;

         if (data.status === 'COMPLETADO') {
            userBookUpdateData.finishedAt = new Date();
            userBookUpdateData.progressPercent = 100;
            userBookUpdateData.currentPage = userBook.book.pageCount || userBook.totalPages;
            
            // ✅ DETECCIÓN: Si no estaba completado y ahora sí
            if (!wasCompleted) isJustFinished = true;
         } else if (data.status === 'LEYENDO' && !userBook.startedAt) {
            userBookUpdateData.startedAt = new Date();
         }
       }
    }

    if (data.tags !== undefined) userBookUpdateData.tags = data.tags;

    if (Object.keys(userBookUpdateData).length > 0) {
      await prisma.userBook.update({ where: { id: userBook.id }, data: userBookUpdateData });
    }

    // ✅ 3. NOTIFICACIÓN
    if (isJustFinished) {
       await this._notifyGamificationBookFinished(userId, bookId);
    }

    return this.getUserBook(userId, bookId);
  }

  async deleteBook(userId, bookId) {
    await prisma.book.update({
      where: { id: parseInt(bookId) },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { message: 'Eliminado' };
  }

  async rateBook(userId, bookId, rating) {
    const userBook = await this.getUserBook(userId, bookId);
    return await prisma.userBook.update({
      where: { id: userBook.id },
      data: { rating: parseFloat(rating) },
    });
  }

  /**
   * ✅ Actualizar progreso (Barra de lectura)
   */
  async updateProgress(userId, bookId, currentPage) {
    const userBook = await this.getUserBook(userId, bookId);
    const wasCompleted = userBook.status === 'COMPLETADO';

    const total = userBook.totalPages || 1;
    const current = parseInt(currentPage);
    const progressPercent = ((current / total) * 100).toFixed(2);
    
    // Detectar si llegó al final
    const isFinished = current >= total;

    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        currentPage: current,
        progressPercent: parseFloat(progressPercent),
        lastReadAt: new Date(),
        // Si llegó al final, cambiar estado automáticamente
        status: isFinished ? 'COMPLETADO' : userBook.status,
        finishedAt: isFinished ? new Date() : userBook.finishedAt,
      },
    });

    // ✅ NOTIFICACIÓN: Si llegó al final y no estaba completado antes
    if (isFinished && !wasCompleted) {
        await this._notifyGamificationBookFinished(userId, bookId);
    }

    return updatedUserBook;
  }

  /**
   * ✅ Cambiar estante (Drag & Drop o Dropdown)
   */
  async changeShelf(userId, bookId, shelf) {
    const userBook = await this.getUserBook(userId, bookId);
    const wasCompleted = userBook.status === 'COMPLETADO';
    
    const validShelves = ['QUIERO_LEER', 'LEYENDO', 'COMPLETADO', 'EN_ESPERA', 'ABANDONADO'];
    if (!validShelves.includes(shelf)) throw new Error('Estante inválido');

    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        status: shelf,
        startedAt: shelf === 'LEYENDO' && !userBook.startedAt ? new Date() : userBook.startedAt,
        finishedAt: shelf === 'COMPLETADO' ? new Date() : null,
        // Si completa, poner progreso al 100%
        progressPercent: shelf === 'COMPLETADO' ? 100 : userBook.progressPercent,
        currentPage: shelf === 'COMPLETADO' ? (userBook.totalPages || userBook.currentPage) : userBook.currentPage
      },
    });

    // ✅ NOTIFICACIÓN
    if (shelf === 'COMPLETADO' && !wasCompleted) {
        await this._notifyGamificationBookFinished(userId, bookId);
    }

    return updatedUserBook;
  }

  async manageTags(userId, bookId, tags) {
    const userBook = await this.getUserBook(userId, bookId);
    return await prisma.userBook.update({
      where: { id: userBook.id },
      data: { tags: Array.isArray(tags) ? tags.join(',') : tags },
    });
  }

  async getLibraryStats(userId) {
    const [totalBooks, byShelf] = await Promise.all([
      prisma.userBook.count({ where: { userId, book: { isDeleted: false } } }),
      prisma.userBook.groupBy({
        by: ['status'],
        where: { userId, book: { isDeleted: false } },
        _count: true,
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
        completado: shelfStats.completado || 0, // Este número ahora subirá correctamente
        enEspera: shelfStats.en_espera || 0,
        abandonado: shelfStats.abandonado || 0,
      }
    };
  }
}

module.exports = new BookService();
/*
const prisma = require('../config/database');
const { uploadBookCover, uploadBookFile } = require('../utils/cloudinary.utils');

class BookService {
  /**
   * Crear nuevo libro y agregarlo a la biblioteca del usuario
   *//*
async createBook(userId, bookData, files = {}) {
    console.log('📚 Service - Creating book');
    console.log('📦 bookData:', bookData);
    console.log('📁 files:', Object.keys(files));

    // Validar campos requeridos
    if (!bookData.titulo || bookData.titulo.trim() === '') {
      throw new Error('El título es requerido');
    }
    if (!bookData.autor || bookData.autor.trim() === '') {
      throw new Error('El autor es requerido');
    }

    // ✅ Validar que source sea un valor válido del enum
  const validSources = ['GOOGLE_BOOKS', 'MANUAL', 'ISBN', 'COMMUNITY', 'PDF', 'EPUB'];
  if (bookData.source && !validSources.includes(bookData.source)) {
    console.error('❌ Invalid source:', bookData.source);
    throw new Error(`Source inválido: ${bookData.source}. Valores válidos: ${validSources.join(', ')}`);
  }

    let coverImageUrl = bookData.coverImageUrl || null;
    let pdfFileUrl = null;
    let epubFileUrl = null;

    // Subir portada si existe
    if (files.cover && files.cover[0]) {
      console.log('📤 Uploading cover to Cloudinary...');
      const tempId = `temp_${Date.now()}`;
      coverImageUrl = await uploadBookCover(files.cover[0].buffer, tempId);
    }

    // Crear libro en BD
    const book = await prisma.book.create({
      data: {
        titulo: bookData.titulo.trim(),
        subtitulo: bookData.subtitulo?.trim() || null,
        autor: bookData.autor.trim(),
        descripcion: bookData.descripcion?.trim() || null,
        pageCount: bookData.pageCount ? parseInt(bookData.pageCount) : null,
        categorias: bookData.categorias?.trim() || null,
        idioma: bookData.idioma || 'es',
        isbn10: bookData.isbn10?.trim() || null,
        isbn13: bookData.isbn13?.trim() || null,
        coverImageUrl: coverImageUrl,
        publicacion: bookData.publicacion?.trim() || null,
        fechaPublicacion: bookData.fechaPublicacion?.trim() || null,
        source: bookData.source  || null,
        googleBookId: bookData.googleBookId || null,
        uploadedByUserId: userId,
        isPublic: true,
        isDeleted: false,
      },
    });

    console.log('✅ Book created with ID:', book.id);

    // Subir PDF si existe
    if (files.pdf && files.pdf[0]) {
      console.log('📤 Uploading PDF to Cloudinary...');
      pdfFileUrl = await uploadBookFile(files.pdf[0].buffer, book.id, 'pdf');
      await prisma.book.update({
        where: { id: book.id },
        data: { pdfFileUrl },
      });
      console.log('✅ PDF uploaded:', pdfFileUrl);
    }

    // Subir EPUB si existe
    if (files.epub && files.epub[0]) {
      console.log('📤 Uploading EPUB to Cloudinary...');
      epubFileUrl = await uploadBookFile(files.epub[0].buffer, book.id, 'epub');
      await prisma.book.update({
        where: { id: book.id },
        data: { epubFileUrl },
      });
      console.log('✅ EPUB uploaded:', epubFileUrl);
    }

    // Crear UserBook
    const userBook = await prisma.userBook.create({
      data: {
        userId,
        bookId: book.id,
        totalPages: book.pageCount || 0,
        status: bookData.shelf || 'QUIERO_LEER',
      },
    });

    console.log('✅ UserBook created');

    return { book, userBook };
  
  }
 /**
   * Crear nuevo libro
   */
  /*
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
  */
/*

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
    */

  /**
   * Obtener libros del usuario con filtros
   *//*
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
   *//*
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
   * Actualizar libro (Datos generales, portada y estado/tags del usuario)
   *//*
  async updateBook(userId, bookId, data, files = {}) {
    // 1. Obtener estado actual para comparar
    const userBook = await this.getUserBook(userId, bookId);
    const wasCompleted = userBook.status === 'COMPLETADO';

    // 2. Lógica de Portada (Igual que antes)
    let coverImageUrl = undefined;
    if (files.cover && files.cover[0]) {
      const tempId = `book_${bookId}_${Date.now()}`;
      coverImageUrl = await uploadBookCover(files.cover[0].buffer, tempId);
    }

    // 3. Update BOOK (Global) - (Igual que antes)
    const bookUpdateData = {};
    if (data.titulo) bookUpdateData.titulo = data.titulo.trim();
    if (data.autor) bookUpdateData.autor = data.autor.trim();
    if (data.descripcion) bookUpdateData.descripcion = data.descripcion.trim();
    if (coverImageUrl) bookUpdateData.coverImageUrl = coverImageUrl;

    if (Object.keys(bookUpdateData).length > 0) {
      await prisma.book.update({
        where: { id: parseInt(bookId) },
        data: bookUpdateData,
      });
    }

    // 4. Update USERBOOK (Estado y Progreso)
    const userBookUpdateData = {};
    let isJustFinished = false; // Bandera para saber si acaba de terminar

    if (data.status) {
       const validShelves = ['QUIERO_LEER', 'LEYENDO', 'COMPLETADO', 'EN_ESPERA', 'ABANDONADO'];
       if (validShelves.includes(data.status)) {
         userBookUpdateData.status = data.status;

         // LOGICA DE COMPLETADO
         if (data.status === 'COMPLETADO') {
            userBookUpdateData.finishedAt = new Date();
            userBookUpdateData.progressPercent = 100;
            userBookUpdateData.currentPage = userBook.book.pageCount || userBook.totalPages;
            
            // ✅ Si NO estaba completado antes, marcamos la bandera
            if (!wasCompleted) {
                isJustFinished = true;
            }
         } 
         else if (data.status === 'LEYENDO' && !userBook.startedAt) {
            userBookUpdateData.startedAt = new Date();
         }
       }
    }

    if (data.tags !== undefined) {
      userBookUpdateData.tags = data.tags;
    }

    if (Object.keys(userBookUpdateData).length > 0) {
      await prisma.userBook.update({
        where: { id: userBook.id },
        data: userBookUpdateData,
      });
    }

    // ✅ 5. NOTIFICAR A GAMIFICATION SERVICE (El Puente)
    if (isJustFinished) {
        console.log('🎉 Libro completado. Notificando a Gamification Service...');
        try {
            // Ajusta la URL al puerto donde corre tu servicio de gamificación (ej: 3004)
            // O usa la variable de entorno si la tienes configurada
            const gamificationUrl = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004';
            
            await axios.post(`${gamificationUrl}/api/gamification/events/book-finished`, {
                userId: userId,
                bookId: parseInt(bookId),
                timestamp: new Date()
            });
            console.log('✅ Gamification notificado correctamente');
        } catch (error) {
            // No bloqueamos el error para que no falle la actualización del libro, solo logueamos
            console.error('❌ Error notificando a Gamification:', error.message);
        }
    }

    return this.getUserBook(userId, bookId);
  }

  /**
   * Actualizar libro (Datos generales, portada y estado/tags del usuario)
   *//*
  async updateBook(userId, bookId, data, files = {}) {
    // 1. Verificar que el usuario tenga este libro
    const userBook = await this.getUserBook(userId, bookId);

    // 2. Lógica de subida de Portada (si se envió una nueva)
    let coverImageUrl = undefined;
    if (files.cover && files.cover[0]) {
      console.log('📤 Updating cover in Cloudinary...');
      const tempId = `book_${bookId}_${Date.now()}`;
      coverImageUrl = await uploadBookCover(files.cover[0].buffer, tempId);
    }

    // 3. Preparar datos para actualizar la tabla BOOK (Global)
    // Solo actualizamos si vienen datos definidos
    const bookUpdateData = {};
    if (data.titulo) bookUpdateData.titulo = data.titulo.trim();
    if (data.autor) bookUpdateData.autor = data.autor.trim();
    if (data.descripcion) bookUpdateData.descripcion = data.descripcion.trim();
    if (coverImageUrl) bookUpdateData.coverImageUrl = coverImageUrl;

    if (Object.keys(bookUpdateData).length > 0) {
      await prisma.book.update({
        where: { id: parseInt(bookId) },
        data: bookUpdateData,
      });
    }

    // 4. Preparar datos para actualizar la tabla USERBOOK (Personal)
    const userBookUpdateData = {};
    
    // Validar y asignar Status
    if (data.status) {
       const validShelves = ['QUIERO_LEER', 'LEYENDO', 'COMPLETADO', 'EN_ESPERA', 'ABANDONADO'];
       if (validShelves.includes(data.status)) {
         userBookUpdateData.status = data.status;
         // Actualizar fechas automáticamente
         if (data.status === 'LEYENDO' && !userBook.startedAt) userBookUpdateData.startedAt = new Date();
         if (data.status === 'COMPLETADO') userBookUpdateData.finishedAt = new Date();
       }
    }

    // Asignar Tags
    if (data.tags !== undefined) { // Permitimos string vacío para borrar tags
      userBookUpdateData.tags = data.tags;
    }

    if (Object.keys(userBookUpdateData).length > 0) {
      await prisma.userBook.update({
        where: { id: userBook.id },
        data: userBookUpdateData,
      });
    }

    // 5. Devolver el libro actualizado completo
    return this.getUserBook(userId, bookId);
  }*/

  /**
   * Actualizar libro
   *
  async updateBook(userId, bookId, updateData) {
    const userBook = await this.getUserBook(userId, bookId);

    const updatedBook = await prisma.book.update({
      where: { id: parseInt(bookId) },
      data: updateData,
    });

    return updatedBook;
  }*/

  /**
   * Eliminar libro (soft delete)
   *//*
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
   *//*
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
   *//*
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
   *//*
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
   *//*
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
   *//*
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