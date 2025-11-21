// library-service/src/routes/book.routes.js

const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../utils/cloudinary.utils');

// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD Libros

// ✅ 1. CREATE: Mantén solo esta definición 
router.post(
  '/books',
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
    { name: 'epub', maxCount: 1 },
  ]),
  bookController.createBook
);

router.get('/books', bookController.getUserBooks);
router.get('/books/stats', bookController.getLibraryStats);
router.get('/books/:id', bookController.getUserBook);

// ✅ 2. UPDATE: Agregamos el middleware upload para recibir la portada ('cover')
router.put(
  '/books/:id', 
  upload.fields([{ name: 'cover', maxCount: 1 }]), 
  bookController.updateBook
);

router.delete('/books/:id', bookController.deleteBook);

// Acciones sobre libros
router.put('/books/:id/rating', bookController.rateBook);
router.put('/books/:id/progress', bookController.updateProgress);
router.put('/books/:id/shelf', bookController.changeShelf);
router.put('/books/:id/tags', bookController.manageTags);

module.exports = router;
/*
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../utils/cloudinary.utils');


// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD Libros
router.post(
  '/books',
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
    { name: 'epub', maxCount: 1 },
  ]),
  bookController.createBook
);

// CRUD Libros
router.post('/books', bookController.createBook);
router.get('/books', bookController.getUserBooks);
router.get('/books/stats', bookController.getLibraryStats);
router.get('/books/:id', bookController.getUserBook);
router.put('/books/:id', bookController.updateBook);
router.delete('/books/:id', bookController.deleteBook);

// Acciones sobre libros
router.put('/books/:id/rating', bookController.rateBook);
router.put('/books/:id/progress', bookController.updateProgress);
router.put('/books/:id/shelf', bookController.changeShelf);
router.put('/books/:id/tags', bookController.manageTags);

module.exports = router;
*/

/*
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller.js');
const { authenticate } = require('../middleware/library.middleware.js');
const { uploadPDF, uploadCover } = require('../utils/cloudinary.utils.js');
const {
  createBookValidation,
  updateBookValidation,
  rateBookValidation,
  updateProgressValidation,
  searchBooksValidation,
} = require('../utils/validators.js');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/library/books
 * @desc    Obtener libros del usuario con filtros
 * @access  Private
 * @query   ?search=texto&shelf=WISHLIST&tags=fantasy,scifi&page=1&limit=20
 */
 //router.get('/', searchBooksValidation, bookController.getUserBooks);

/**
 * @route   GET /api/library/books/stats
 * @desc    Obtener estadísticas de biblioteca
 * @access  Private
 */
//router.get('/stats', bookController.getStats);

/**
 * @route   GET /api/library/books/:id
 * @desc    Obtener libro por ID
 * @access  Private
 */
//router.get('/:id', bookController.getBookById);

/**
 * @route   POST /api/library/books
 * @desc    Crear nuevo libro
 * @access  Private
 */
//router.post('/', createBookValidation, bookController.createBook);

/**
 * @route   PUT /api/library/books/:id
 * @desc    Actualizar libro
 * @access  Private
 */
//router.put('/:id', updateBookValidation, bookController.updateBook);

/**
 * @route   DELETE /api/library/books/:id
 * @desc    Eliminar libro (soft delete)
 * @access  Private
 */
//router.delete('/:id', bookController.deleteBook);

/**
 * @route   PUT /api/library/books/:id/rating
 * @desc    Calificar libro (estrellas)
 * @access  Private
 */
//router.put('/:id/rating', rateBookValidation, bookController.rateBook);

/**
 * @route   PUT /api/library/books/:id/progress
 * @desc    Actualizar progreso de lectura
 * @access  Private
 */
//router.put('/:id/progress', updateProgressValidation, bookController.updateProgress);

/**
 * @route   PUT /api/library/books/:id/shelf
 * @desc    Cambiar estante
 * @access  Private
 */
//router.put('/:id/shelf', bookController.changeShelf);

/**
 * @route   POST /api/library/books/:id/pdf
 * @desc    Subir PDF del libro
 * @access  Private
 */
//router.post('/:id/pdf', uploadPDF.single('pdf'), bookController.uploadPDF);

/**
 * @route   POST /api/library/books/:id/cover
 * @desc    Subir portada del libro
 * @access  Private
 */
//router.post('/:id/cover', uploadCover.single('cover'), bookController.uploadCover);

/**
 * @route   PUT /api/library/books/:id/tags
 * @desc    Gestionar tags del libro
 * @access  Private
 */
//router.put('/:id/tags', bookController.manageTags);

/*
router.use(authenticate);

router.get('/', searchBooksValidation, bookController.getUserBooks);
router.get('/stats', bookController.getStats);
router.get('/:id', bookController.getBookById);
router.post('/', createBookValidation, bookController.createBook);
router.put('/:id', updateBookValidation, bookController.updateBook);
router.delete('/:id', bookController.deleteBook);
router.put('/:id/rating', rateBookValidation, bookController.rateBook);
router.put('/:id/progress', updateProgressValidation, bookController.updateProgress);
router.put('/:id/shelf', bookController.changeShelf);
router.post('/:id/pdf', uploadPDF.single('pdf'), bookController.uploadPDF);
router.post('/:id/cover', uploadCover.single('cover'), bookController.uploadCover);
router.put('/:id/tags', bookController.manageTags);

module.exports = router;
*/