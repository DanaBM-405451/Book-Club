// library-service/src/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bookRoutes = require('./routes/book.routes');
const noteRoutes = require('./routes/note.routes');
const annotationRoutes = require('./routes/annotation.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'library-service',
    timestamp: new Date().toISOString(),
  });
});

// Rutas
app.use('/api/library', bookRoutes);
app.use('/api/library', noteRoutes);
app.use('/api/library', annotationRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
  
    message: 'Ruta no encontrada',
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     📚 LIBRARY SERVICE RUNNING                 ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}            ║
║                                                ║
║  Features:                                     ║
║  ├─ 📖 Book Management (CRUD)                  ║
║  ├─ 📝 Notes & Annotations                     ║
║  ├─ 🔖 Bookmarks                               ║
║  ├─ 📊 Reading Sessions                        ║
║  ├─ 🎮 Gamification Integration                ║
║  └─ 📈 Reading Statistics                      ║
║                                                ║
║  Health: http://localhost:${PORT}/health        ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;


/*

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/library.middleware');
const bookController = require('./controllers/book.controller');
const noteController = require('./controllers/note.controller'); // ✅ Importar
const { uploadPDF, uploadEPUB, uploadCover } = require('./utils/cloudinary.utils');

const app = express();
const PORT = process.env.PORT || 3003;

// ============================================
// MIDDLEWARES
// ============================================

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'library-service',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// RUTAS DE LIBROS
// ============================================

app.get('/api/library/books/stats', authenticate, bookController.getStats);
app.get('/api/library/books/:id', authenticate, bookController.getBookById);
app.get('/api/library/books', authenticate, bookController.getUserBooks);
app.post('/api/library/books', authenticate, bookController.createBook);
app.put('/api/library/books/:id', authenticate, bookController.updateBook);
app.delete('/api/library/books/:id', authenticate, bookController.deleteBook);
app.put('/api/library/books/:id/rating', authenticate, bookController.rateBook);
app.put('/api/library/books/:id/progress', authenticate, bookController.updateProgress);
app.put('/api/library/books/:id/shelf', authenticate, bookController.changeShelf);
app.put('/api/library/books/:id/tags', authenticate, bookController.manageTags);

// Archivos
app.post('/api/library/books/:id/pdf', authenticate, uploadPDF.single('pdf'), bookController.uploadPDF);
app.post('/api/library/books/:id/epub', authenticate, uploadEPUB.single('epub'), bookController.uploadEPUB);
app.post('/api/library/books/:id/cover', authenticate, uploadCover.single('cover'), bookController.uploadCover);
app.delete('/api/library/books/:id/pdf', authenticate, bookController.deletePDF);
app.delete('/api/library/books/:id/epub', authenticate, bookController.deleteEPUB);

// ============================================
//  RUTAS DE NOTAS
// ============================================

// Notas generales del usuario
app.get('/api/library/notes', authenticate, noteController.getAllUserNotes);
app.get('/api/library/notes/:id', authenticate, noteController.getNoteById);
app.put('/api/library/notes/:id', authenticate, noteController.updateNote);
app.delete('/api/library/notes/:id', authenticate, noteController.deleteNote);

// Notas específicas de un libro
app.post('/api/library/books/:bookId/notes', authenticate, noteController.createNote);
app.get('/api/library/books/:bookId/notes', authenticate, noteController.getBookNotes);


// library-service/src/index.js

const annotationController = require('./controllers/annotation.controller');

// ... (código existente) ...

// ============================================
// RUTAS DE ANOTACIONES Y HIGHLIGHTS
// ============================================

// Anotaciones
app.post('/api/library/books/:bookId/annotations', authenticate, annotationController.createAnnotation);
app.get('/api/library/books/:bookId/annotations', authenticate, annotationController.getBookAnnotations);
app.put('/api/library/annotations/:id', authenticate, annotationController.updateAnnotation);
app.delete('/api/library/annotations/:id', authenticate, annotationController.deleteAnnotation);

// Marcadores
app.post('/api/library/books/:bookId/bookmarks', authenticate, annotationController.createBookmark);
app.get('/api/library/books/:bookId/bookmarks', authenticate, annotationController.getBookBookmarks);

// Sesiones de lectura
app.post('/api/library/books/:bookId/reading-session', authenticate, annotationController.recordReadingSession);

// ============================================
// ERROR HANDLING
// ============================================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        📚 LIBRARY SERVICE RUNNING              ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}           ║
║                                                ║
║  Book routes:                                  ║
║  ├─ GET    /api/library/books                  ║
║  ├─ POST   /api/library/books                  ║
║  ├─ GET    /api/library/books/:id              ║
║  ├─ PUT    /api/library/books/:id              ║
║  ├─ DELETE /api/library/books/:id              ║
║  ├─ POST   /api/library/books/:id/pdf          ║
║  ├─ POST   /api/library/books/:id/epub         ║
║  └─ POST   /api/library/books/:id/cover        ║
║                                                ║
║  Note routes:                                  ║
║  ├─ GET    /api/library/notes                  ║
║  ├─ POST   /api/library/books/:id/notes        ║
║  ├─ GET    /api/library/books/:id/notes        ║
║  ├─ GET    /api/library/notes/:id              ║
║  ├─ PUT    /api/library/notes/:id              ║
║  └─ DELETE /api/library/notes/:id              ║
║                                                ║
║  Health: http://localhost:${PORT}/health        ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
*/

/*
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/library.middleware');
const bookController = require('./controllers/book.controller');

const app = express();
const PORT = process.env.PORT || 3003;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Log de TODAS las requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  next();
});

// ============================================
// HEALTH CHECK (sin auth)
// ============================================

app.get('/health', (req, res) => {
  console.log('✅ Health check');
  res.json({
    status: 'ok',
    service: 'library-service',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// TEST ROUTE (sin auth)
// ============================================

app.get('/api/library/test', (req, res) => {
  console.log('✅ Test route');
  res.json({
    success: true,
    message: 'Library service is working!',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// ✅ GET books
app.get('/api/library/books', (req, res, next) => {
  console.log('📚 GET /api/library/books - ANTES de authenticate');
  next();
}, authenticate, (req, res, next) => {
  console.log('📚 GET /api/library/books - DESPUÉS de authenticate');
  console.log('User:', req.user);
  bookController.getUserBooks(req, res, next);
});

// ✅ POST book
app.post('/api/library/books', authenticate, (req, res, next) => {
  console.log('📚 POST /api/library/books');
  bookController.createBook(req, res, next);
});

// ✅ GET book by ID
app.get('/api/library/books/:id', authenticate, (req, res, next) => {
  console.log(`📚 GET /api/library/books/${req.params.id}`);
  bookController.getBookById(req, res, next);
});

// ✅ GET stats
app.get('/api/library/books/stats', authenticate, (req, res, next) => {
  console.log('📚 GET /api/library/books/stats');
  bookController.getStats(req, res, next);
});

// ============================================
// 404 HANDLER (DEBE IR AL FINAL)
// ============================================

app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /health',
      'GET /api/library/test',
      'GET /api/library/books',
      'POST /api/library/books',
      'GET /api/library/books/:id',
      'GET /api/library/books/stats'
    ]
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        📚 LIBRARY SERVICE RUNNING              ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}           ║
║                                                ║
║  Routes registered:                            ║
║  ├─ GET  /health (no auth)                     ║
║  ├─ GET  /api/library/test (no auth)           ║
║  ├─ GET  /api/library/books (auth)             ║
║  ├─ POST /api/library/books (auth)             ║
║  ├─ GET  /api/library/books/:id (auth)         ║
║  └─ GET  /api/library/books/stats (auth)       ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
*/

/*require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bookRoutes = require('./routes/book.routes');
const noteRoutes = require('./routes/note.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares globales
//app.use(cors());
app.use(cors({
  origin: [
    process.env.GATEWAY_URL || 'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:4000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'library-service',
    timestamp: new Date().toISOString(),
  });
});

// Rutas
//app.use('/api/library/books', bookRoutes);
//app.use('/api/library/notes', noteRoutes);

app.use('/api/library',bookRoutes);
app.use('/api/library',noteRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(` Library Service running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════╗
║         LIBRARY SERVICE RUNNING                ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                  
║  Environment: ${process.env.NODE_ENV || 'development'}           
║                                                
║  Routes:                                       
║  ├─ GET    /api/library/books                  
║  ├─ GET    /api/library/books/stats            
║  ├─ GET    /api/library/books/:id              
║  ├─ POST   /api/library/books                  
║  ├─ PUT    /api/library/books/:id              
║  ├─ DELETE /api/library/books/:id              
║  ├─ PUT    /api/library/books/:id/progress     
║  ├─ POST   /api/library/books/:id/pdf          
║  └─ POST   /api/library/books/:id/cover        
║                                                
║  Health: http://localhost:${PORT}/health        
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
*/