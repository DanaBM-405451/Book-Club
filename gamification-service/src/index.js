require('dotenv').config();
const express = require('express');
const cors = require('cors');
const gamificationRoutes = require('./routes/gamification.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3004;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'gamification-service',
    timestamp: new Date().toISOString(),
  });
});

// Rutas
app.use('/api/gamification', gamificationRoutes);

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
║     🎮 GAMIFICATION SERVICE RUNNING            ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}            ║
║                                                ║
║  Features:                                     ║
║  ├─ ⭐ XP System (1 page = 1 XP)               ║
║  ├─ 🎚️ Level System (dynamic)                  ║
║  ├─ 🔥 Streak Tracking                         ║
║  ├─ 🏆 Achievements (20+)                      ║
║  └─ 📊 Leaderboards                            ║
║                                                ║
║  Health: http://localhost:${PORT}/health        ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;