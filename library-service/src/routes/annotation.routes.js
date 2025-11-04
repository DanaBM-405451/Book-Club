// library-service/src/routes/annotation.routes.js

const express = require('express');
const router = express.Router();
const annotationController = require('../controllers/annotation.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Anotaciones
router.post('/books/:bookId/annotations', annotationController.createAnnotation);
router.get('/books/:bookId/annotations', annotationController.getBookAnnotations);
router.put('/annotations/:id', annotationController.updateAnnotation);
router.delete('/annotations/:id', annotationController.deleteAnnotation);

// Marcadores
router.post('/books/:bookId/bookmarks', annotationController.createBookmark);
router.get('/books/:bookId/bookmarks', annotationController.getBookBookmarks);
router.delete('/bookmarks/:id', annotationController.deleteBookmark);

// Sesiones de lectura
router.post('/books/:bookId/reading-session', annotationController.recordReadingSession);

// Estadísticas
router.get('/stats/reading', annotationController.getUserReadingStats);

module.exports = router;