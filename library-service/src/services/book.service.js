// library-service/src/services/book.service.js

const prisma = require('../config/database');
const { uploadBookCover, uploadBookFile } = require('../utils/cloudinary.utils');
const { extractPdfMetadata, extractEpubMetadata, cleanupTempFile, normalizeMetadata} = require('../utils/fileMetadata')
const axios = require('axios'); 

class BookService {
  
  // --- MÉTODO PRIVADO: Notificar a Gamification Service ---
  async _notifyGamification(userId, data) {
    try {
      const gamificationUrl = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004';
      
      console.log(`🎮 Notificando a Gamification:`, data);
      
      await axios.post(`${gamificationUrl}/api/gamification/stats/update`, {
        userId,
        ...data
      });
      
    } catch (error) {
      console.error('❌ Error notificando a Gamification:', error.message);
    }
  }

  async createBook(userId, bookData, files = {}) {
    console.log('📚 Service - Creating book');

    // 1. EXTRAER METADATOS
    let detectedMeta = { pageCount: 0, titulo: null, autor: null, description: null };

    try {
      if (files.pdf && files.pdf[0] && files.pdf[0].path) {
        const pdfMeta = await extractPdfMetadata(files.pdf[0].path);
        detectedMeta = normalizeMetadata(pdfMeta);
      } else if (files.epub && files.epub[0] && files.epub[0].path) {
        const epubMeta = await extractEpubMetadata(files.epub[0].path);
        detectedMeta = normalizeMetadata(epubMeta);
      }
    } catch (error) {
      console.error('❌ Error extrayendo metadatos:', error);
    }

    // 2. COMBINAR DATOS
    const tituloFinal = (bookData.titulo && bookData.titulo.trim() !== "") 
                      ? bookData.titulo 
                      : (detectedMeta.titulo || "Sin título");

    const autorFinal = (bookData.autor && bookData.autor.trim() !== "") 
                      ? bookData.autor 
                      : (detectedMeta.autor || "Autor Desconocido");

    let pageCountFinal = parseInt(bookData.pageCount);
    if (!pageCountFinal || pageCountFinal <= 0) {
        pageCountFinal = detectedMeta.pageCount || 100;
    }

    // 3. SUBIR PORTADA
    let coverImageUrl = bookData.coverImageUrl || null;
    if (files.cover && files.cover[0]) {
      const tempId = `temp_${Date.now()}`;
      coverImageUrl = await uploadBookCover(files.cover[0].path, tempId);
      await cleanupTempFile(files.cover[0].path);
    }

    // 4. CREAR LIBRO
    const book = await prisma.book.create({
      data: {
        titulo: tituloFinal,
        autor: autorFinal,
        descripcion: bookData.descripcion || detectedMeta.descripcion || null,
        pageCount: pageCountFinal,
        categorias: bookData.categorias || null,
        idioma: bookData.idioma || detectedMeta.idioma || 'es',
        isbn10: bookData.isbn10 || null,
        isbn13: bookData.isbn13 || null,
        coverImageUrl,
        publicacion: bookData.publicacion || null,
        fechaPublicacion: bookData.fechaPublicacion || null,
        source: bookData.source || 'MANUAL',
        googleBookId: bookData.googleBookId || null,
        uploadedByUserId: userId,
        isPublic: true,
        isDeleted: false,
      },
    });

    // 5. SUBIR ARCHIVOS
    let pdfFileUrl = null;
    let epubFileUrl = null;

    if (files.pdf && files.pdf[0]) {
      pdfFileUrl = await uploadBookFile(files.pdf[0].path, book.id, 'pdf');
      await prisma.book.update({ where: { id: book.id }, data: { pdfFileUrl } });
      await cleanupTempFile(files.pdf[0].path);
    }

    if (files.epub && files.epub[0]) {
      epubFileUrl = await uploadBookFile(files.epub[0].path, book.id, 'epub');
      await prisma.book.update({ where: { id: book.id }, data: { epubFileUrl } });
      await cleanupTempFile(files.epub[0].path);
    }

    // 6. AGREGAR A BIBLIOTECA
    const userBook = await prisma.userBook.create({
      data: {
        userId,
        bookId: book.id,
        totalPages: pageCountFinal,
        status: bookData.shelf || 'QUIERO_LEER',
        currentPage: 0
      },
    });

    // Notificar si se creó como completado (raro, pero posible)
    if (userBook.status === 'COMPLETADO') {
        this._notifyGamification(userId, { booksCompleted: 1, xpGained: 50, reason: 'Libro creado como completado' });
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

  async updateBook(userId, bookId, data, files = {}) {
    const userBook = await this.getUserBook(userId, bookId);
    const wasCompleted = userBook.status === 'COMPLETADO';

    // 1. Actualizar datos del libro (Tabla Book) - SIN CAMBIOS AQUÍ
    let coverImageUrl = undefined;
    if (files.cover && files.cover[0]) {
      const tempId = `book_${bookId}_${Date.now()}`;
      coverImageUrl = await uploadBookCover(files.cover[0].path, tempId);
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
    
    // Variables para controlar la notificación
    let statusChanged = false;
    let newStatus = userBook.status;

    if (data.status) {
       const validShelves = ['QUIERO_LEER', 'LEYENDO', 'COMPLETADO', 'EN_ESPERA', 'ABANDONADO'];
       if (validShelves.includes(data.status)) {
         userBookUpdateData.status = data.status;
         newStatus = data.status;
         statusChanged = data.status !== userBook.status;

         if (data.status === 'COMPLETADO') {
            userBookUpdateData.finishedAt = new Date();
            userBookUpdateData.progressPercent = 100;
            // Si es EPUB o no tiene paginas, mantenemos el total
            userBookUpdateData.currentPage = userBook.book.pageCount || userBook.totalPages;
         } else if (data.status === 'LEYENDO' && !userBook.startedAt) {
            userBookUpdateData.startedAt = new Date();
         }
         // Si sacamos de completado, limpiamos finishedAt? Opcional. 
         // userBookUpdateData.finishedAt = null; 
       }
    }

    if (data.tags !== undefined) userBookUpdateData.tags = data.tags;

    if (Object.keys(userBookUpdateData).length > 0) {
      await prisma.userBook.update({ where: { id: userBook.id }, data: userBookUpdateData });
    }

    // ✅ 3. NOTIFICACIÓN INTELIGENTE (SUMA O RESTA)
    if (statusChanged) {
        // A) Se completó (No estaba completo -> Ahora sí)
        if (!wasCompleted && newStatus === 'COMPLETADO') {
            this._notifyGamification(userId, { 
                booksCompleted: 1, 
                xpGained: 50, 
                reason: 'Libro completado' 
            });
        }
        // B) Se descompletó (Estaba completo -> Ahora no)
        else if (wasCompleted && newStatus !== 'COMPLETADO') {
            this._notifyGamification(userId, { 
                booksCompleted: -1, // 👈 RESTAMOS EL LIBRO
                xpGained: -50,      // 👈 RESTAMOS LA XP
                reason: 'Corrección de estado' 
            });
        }
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
   * ✅ Actualizar progreso (Barra de lectura + TIEMPO + NOTIFICACIÓN DE RACHA)
   *  Actualizar progreso (Soporte Dual: Página Entera + CFI)
   **/

  
  async updateProgress(userId, bookId, currentPage, durationMinutes = 0, pagesRead = 0, lastReadPosition = null) {
    const userBook = await this.getUserBook(userId, bookId);
    const wasCompleted = userBook.status === 'COMPLETADO';
    
    const updateData = {
        lastReadAt: new Date(),
    };

    // 1. TIEMPO
    const minutes = durationMinutes && Number(durationMinutes) > 0 ? parseInt(durationMinutes) : 0;
    if (minutes > 0) {
        updateData.totalReadingTimeMinutes = {
            increment: minutes
        };
    }

    let isJustFinished = false;

    // 2. POSICIÓN EXACTA (CFI para EPUB)
    // Si el frontend nos manda una posición exacta (epubcfi...), la guardamos.
    if (lastReadPosition && typeof lastReadPosition === 'string') {
        updateData.lastReadPosition = lastReadPosition;
    }

    // 3. BARRA DE PROGRESO (Número de página)
    // El frontend ahora siempre manda un número entero en 'currentPage'
    const pageNum = parseInt(currentPage);
    
    if (!isNaN(pageNum) && pageNum >= 0) {
        updateData.currentPage = pageNum;
        
        // Calcular porcentaje visual
        const total = userBook.totalPages || 1;
        const percent = ((pageNum / total) * 100).toFixed(2);
        updateData.progressPercent = Math.min(100, parseFloat(percent));
        
        // Completar si llega al final (Margen de error de 2 páginas)
        if (pageNum >= (total - 2) && !wasCompleted) {
            updateData.status = 'COMPLETADO';
            updateData.finishedAt = new Date();
            updateData.progressPercent = 100;
            isJustFinished = true;
        }
    }

    // 4. EJECUTAR UPDATE EN DB
    const result = await prisma.userBook.update({
      where: { id: userBook.id },
      data: updateData,
    });

    // 5. NOTIFICAR A GAMIFICACIÓN
    // Si hubo minutos, páginas o se completó
    if (minutes > 0 || pagesRead > 0 || isJustFinished) {
        const gamificationData = {
            minutesRead: minutes,
            pagesRead: pagesRead, 
            reason: 'Progreso de lectura'
        };

        if (isJustFinished) {
            gamificationData.booksCompleted = 1;
            gamificationData.xpGained = 50; 
        } else {
            // XP: 1 por minuto + 1 por página leída
            gamificationData.xpGained = minutes + (pagesRead || 0); 
        }

        this._notifyGamification(userId, gamificationData);
    }

    return result;
  }
  
  async changeShelf(userId, bookId, shelf) {
    const userBook = await this.getUserBook(userId, bookId);
    const wasCompleted = userBook.status === 'COMPLETADO';
    const isNowCompleted = shelf === 'COMPLETADO';
    
    const validShelves = ['QUIERO_LEER', 'LEYENDO', 'COMPLETADO', 'EN_ESPERA', 'ABANDONADO'];
    if (!validShelves.includes(shelf)) throw new Error('Estante inválido');

    // Preparamos update
    const updateData = {
        status: shelf,
        startedAt: shelf === 'LEYENDO' && !userBook.startedAt ? new Date() : userBook.startedAt,
    };

    if (isNowCompleted) {
        updateData.finishedAt = new Date();
        updateData.progressPercent = 100;
        updateData.currentPage = userBook.totalPages || userBook.currentPage;
    } else if (wasCompleted) {
        // Si salimos de completado, ¿queremos resetear el progreso?
        // Generalmente no, pero el finishedAt deja de tener sentido como "último"
        // updateData.finishedAt = null; 
    }

    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBook.id },
      data: updateData,
    });

    // ✅ LÓGICA DE NOTIFICACIÓN (SUMA O RESTA)
    if (!wasCompleted && isNowCompleted) {
        // Sumar
        this._notifyGamification(userId, { 
            booksCompleted: 1, 
            xpGained: 50, 
            reason: 'Estante cambiado a completado' 
        });
    } else if (wasCompleted && !isNowCompleted) {
        // Restar
        this._notifyGamification(userId, { 
            booksCompleted: -1, // 👈 RESTAMOS
            xpGained: -50,      // 👈 RESTAMOS
            reason: 'Estante cambiado de completado' 
        });
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
        completado: shelfStats.completado || 0,
        enEspera: shelfStats.en_espera || 0,
        abandonado: shelfStats.abandonado || 0,
      }
    };
  }

  async getGlobalLibraryStats({ startDate, endDate, genre } = {}) {
    const whereClause = { isDeleted: false };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt = { gte: start, lte: end };
      }
    }

    if (genre && genre !== 'TODOS' && genre !== 'undefined') {
      whereClause.categorias = { contains: genre };
    }

    try {
      const totalBooks = await prisma.book.count({ where: whereClause });
      
      const readsWhere = { status: 'COMPLETADO' };
      if (whereClause.createdAt) readsWhere.updatedAt = whereClause.createdAt;
      const totalReads = await prisma.userBook.count({ where: readsWhere });
      
      const latestBooks = await prisma.book.findMany({
        take: 50,
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        select: { titulo: true, autor: true, categorias: true, createdAt: true, uploadedByUserId: true }
      });

      const mappedBooks = latestBooks.map(b => ({
        ...b,
        genero: b.categorias ? b.categorias.split(',')[0] : 'General'
      }));

      return { totalBooks, totalReads, latestBooks: mappedBooks };

    } catch (error) {
      console.error("🔥 Error crítico en BookService:", error);
      return { totalBooks: 0, totalReads: 0, latestBooks: [] };
    }
  }

  /**
   * Obtener lista de géneros únicos
   */
  async getUniqueGenres() {
    try {
      // Obtenemos todos los libros que tengan categoría
      const books = await prisma.book.findMany({
        where: { 
            isDeleted: false,
            categorias: { not: null }
        },
        select: { categorias: true }
      });

      // Extraemos, separamos por comas y limpiamos
      const allGenres = new Set();
      
      books.forEach(book => {
        if (book.categorias) {
            // Google Books a veces manda "Fiction / Fantasy", otras veces "Fantasy"
            // Vamos a limpiar un poco
            const cats = book.categorias.split(',').map(c => c.trim());
            cats.forEach(c => allGenres.add(c));
        }
      });

      // Retornar ordenados alfabéticamente
      return Array.from(allGenres).sort();
    } catch (error) {
      console.error('Error getting genres:', error);
      return [];
    }
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