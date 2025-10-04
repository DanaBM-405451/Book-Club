require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authProxy = require('./routes/authProxy');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json());

// Rutas de proxy
app.use('/api/auth', authProxy);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'api-gateway', 
    timestamp: new Date().toISOString() 
  });
});

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({ 
    message: 'Reading Club API Gateway', 
    version: '1.0.0',
    endpoints: ['/api/auth', '/health']
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong in API Gateway!' });
});

app.listen(PORT, () => {
  console.log(`🚪 API Gateway running on port ${PORT}`);
});