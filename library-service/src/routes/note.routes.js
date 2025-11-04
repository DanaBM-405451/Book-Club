// library-service/src/routes/note.routes.js

const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Notas generales
router.get('/notes', noteController.getAllUserNotes);
router.get('/notes/:id', noteController.getNoteById);
router.put('/notes/:id', noteController.updateNote);
router.delete('/notes/:id', noteController.deleteNote);

// Notas de un libro específico
router.post('/books/:bookId/notes', noteController.createNote);
router.get('/books/:bookId/notes', noteController.getBookNotes);

module.exports = router;

/*
const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller.js');
const { authenticate } = require('../middleware/library.middleware.js');
const {
  createNoteValidation,
  updateNoteValidation,
} = require('../utils/validators.js');
*/

// Todas las rutas requieren autenticación
//router.use(authenticate);

/**
 * @route   GET /api/library/notes
 * @desc    Obtener todas las notas del usuario
 * @access  Private
 * @query   ?page=1&limit=50
 */
//router.get('/', noteController.getAllUserNotes);

/**
 * @route   GET /api/library/notes/:id
 * @desc    Obtener nota por ID
 * @access  Private
 */
//router.get('/:id', noteController.getNoteById);

/**
 * @route   PUT /api/library/notes/:id
 * @desc    Actualizar nota
 * @access  Private
 */
//router.put('/:id', updateNoteValidation, noteController.updateNote);

/**
 * @route   DELETE /api/library/notes/:id
 * @desc    Eliminar nota
 * @access  Private
 */
//router.delete('/:id', noteController.deleteNote);

/**
 * @route   POST /api/library/books/:bookId/notes
 * @desc    Crear nota en un libro
 * @access  Private
 */
//router.post('/books/:bookId/notes', createNoteValidation, noteController.createNote);

/**
 * @route   GET /api/library/books/:bookId/notes
 * @desc    Obtener todas las notas de un libro
 * @access  Private
 */
/*
router.get('/books/:bookId/notes', noteController.getBookNotes);


router.use(authenticate);

router.get('/', noteController.getAllUserNotes);
router.get('/:id', noteController.getNoteById);
router.put('/:id', updateNoteValidation, noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

// Notas de libros
router.post('/books/:bookId/notes', createNoteValidation, noteController.createNote);
router.get('/books/:bookId/notes', noteController.getBookNotes);


module.exports = router;
*/