// api-gateway/src/index.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const LIBRARY_SERVICE = process.env.LIBRARY_SERVICE_URL || 'http://localhost:3003';
const GAMIFICATION_SERVICE = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004';
const SOCIAL_SERVICE = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3005';

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true,
}));

// ✅ PARSEAR BODY ANTES DE TODO
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging con DEBUG
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  console.log('📋 Headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers['authorization'] ? '✅ Present' : '❌ Missing'
  });
  
  // ✅ LOG CRÍTICO: Ver el body que llega
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('📦 Body received in gateway:', req.body);
  }
  
  next();
});

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      auth: AUTH_SERVICE,
      user: USER_SERVICE,
      library: LIBRARY_SERVICE,
      gamification: GAMIFICATION_SERVICE,
      social: SOCIAL_SERVICE,
    },
  });
});

// Forward function
async function forwardRequest(req, res, targetService) {
  try {
    const targetUrl = `${targetService}${req.path}`;
    console.log(`🔄 Forwarding to ${targetUrl}`);
    console.log(`📦 Body being sent:`, req.body);

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        'content-type': req.headers['content-type'] || 'application/json',
        'authorization': req.headers['authorization'],
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    console.log(`✅ Response status: ${response.status}`);
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Error forwarding:`, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: `Service unavailable`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gateway error',
      error: error.message,
    });
  }
}

// ✅ Routes - EN ORDEN DE ESPECIFICIDAD (más específicas primero)
app.all('/api/auth/*', (req, res) => forwardRequest(req, res, AUTH_SERVICE));
app.all('/api/users/*', (req, res) => forwardRequest(req, res, USER_SERVICE));
app.all('/api/library/*', (req, res) => forwardRequest(req, res, LIBRARY_SERVICE));
app.all('/api/gamification/*', (req, res) => forwardRequest(req, res, GAMIFICATION_SERVICE));
app.all('/api/social/*', (req, res) => forwardRequest(req, res, SOCIAL_SERVICE)); // ✅ CORREGIDO

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        🚀 API GATEWAY RUNNING                  ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║                                                ║
║  Services:                                     ║
║  ├─ Auth:          ${AUTH_SERVICE}            ║
║  ├─ User:          ${USER_SERVICE}            ║
║  ├─ Library:       ${LIBRARY_SERVICE}         ║
║  ├─ Gamification:  ${GAMIFICATION_SERVICE}    ║
║  └─ Social:        ${SOCIAL_SERVICE}          ║
╚════════════════════════════════════════════════╝
  `);
});

/*

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const LIBRARY_SERVICE = process.env.LIBRARY_SERVICE_URL || 'http://localhost:3003';
const GAMIFICATION_SERVICE = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004';
const SOCIAL_SERVICE = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3005';

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true,
}));

// ✅ PARSEAR BODY ANTES DE TODO
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging con DEBUG
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  console.log('📋 Headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers['authorization'] ? '✅ Present' : '❌ Missing'
  });
  
  // ✅ LOG CRÍTICO: Ver el body que llega
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('📦 Body received in gateway:', req.body);
  }
  
  next();
});

app.use('/api/library/books', (req, res, next) => {
  if (req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
    console.log('🔄 Proxying multipart upload to library-service');
    
    const proxy = createProxyMiddleware({
      target: process.env.LIBRARY_SERVICE_URL || 'http://localhost:3003',
      changeOrigin: true,
      pathRewrite: {
        '^/api/library': '/api/library',
      },
      onProxyReq: (proxyReq, req) => {
        // ✅ Copiar headers importantes
        if (req.headers.authorization) {
          proxyReq.setHeader('Authorization', req.headers.authorization);
        }
        console.log('✅ Proxying with auth header');
      },
    });
    
    return proxy(req, res, next);
  }
  next();
});


// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      auth: AUTH_SERVICE,
      user: USER_SERVICE,
      library: LIBRARY_SERVICE,
      gamification: GAMIFICATION_SERVICE,
      social: SOCIAL_SERVICE,
    },
  });
});

// Forward function
async function forwardRequest(req, res, targetService) {
  try {
    const targetUrl = `${targetService}${req.path}`;
    console.log(`🔄 Forwarding to ${targetUrl}`);
    console.log(`📦 Body being sent:`, req.body);

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        'content-type': req.headers['content-type'] || 'application/json',
        'authorization': req.headers['authorization'],
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    console.log(`✅ Response status: ${response.status}`);
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Error forwarding:`, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: `Service unavailable`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gateway error',
      error: error.message,
    });
  }
}

// Routes
app.all('/api/auth/*', (req, res) => forwardRequest(req, res, AUTH_SERVICE));
app.all('/api/users/*', (req, res) => forwardRequest(req, res, USER_SERVICE));
app.all('/api/library/*', (req, res) => forwardRequest(req, res, LIBRARY_SERVICE));
app.all('/api/gamification/*', (req, res) => forwardRequest(req, res, GAMIFICATION_SERVICE));
app.all('api/social/*',(req,res) => forwardRequest(req, res, SOCIAL_SERVICE));

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        🚀 API GATEWAY RUNNING                  ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
*/
/*
// ============================================
// API GATEWAY - Book Club
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RATE LIMITING
// ============================================

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// ============================================
// CONFIGURACIÓN DE SERVICIOS
// ============================================

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  library: process.env.LIBRARY_SERVICE_URL || 'http://localhost:3003',
  gamification: process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004',
  social: process.env.SOCIAL_SERVICE_URL || 'http://localhost:3005',
};

// ============================================
// OPCIONES DE PROXY
// ============================================

const proxyOptions = (target, context) => ({
  target,
  changeOrigin: true,
  //pathRewrite: { [`^${context}`]: '' },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req) => {
    console.log(`[PROXY] ${req.method} ${req.originalUrl} → ${target}`);
  },
  onError: (err, req, res) => {
    console.error(`[PROXY ERROR] ${err.message}`);
    res.status(503).json({ success: false, message: 'Service unavailable', target });
  },
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    axios.get(`${SERVICES.auth}/health`).catch(() => null),
    axios.get(`${SERVICES.user}/health`).catch(() => null),
    axios.get(`${SERVICES.library}/health`).catch(() => null),
  ]);

  const services = {
    auth: checks[0]?.value ? 'up' : 'down',
    user: checks[1]?.value ? 'up' : 'down',
    library: checks[2]?.value ? 'up' : 'down',
  };

  const allUp = Object.values(services).every(s => s === 'up');

  res.status(allUp ? 200 : 503).json({
    status: allUp ? 'ok' : 'degraded',
    gateway: 'api-gateway',
    timestamp: new Date().toISOString(),
    services,
  });
});

// ============================================
// RUTAS PROXY A MICROSERVICIOS
// ============================================

// AUTH SERVICE
app.use('/api/auth/login', authLimiter, createProxyMiddleware(proxyOptions(SERVICES.auth ))); //', /api/auth'
app.use('/api/auth/register', authLimiter, createProxyMiddleware(proxyOptions(SERVICES.auth ))); //, '/api/auth'
app.use('/api/auth', generalLimiter, createProxyMiddleware(proxyOptions(SERVICES.auth ))); //, '/api/auth'

// USER SERVICE
app.use('/api/users', generalLimiter, createProxyMiddleware(proxyOptions(SERVICES.user, '/api/users')));

// LIBRARY SERVICE
app.use('/api/library', generalLimiter, createProxyMiddleware(proxyOptions(SERVICES.library, '/api/library')));

// GAMIFICATION SERVICE
app.use('/api/gamification', generalLimiter, createProxyMiddleware(proxyOptions(SERVICES.gamification, '/api/gamification')));

// SOCIAL SERVICE
app.use('/api/social', generalLimiter, createProxyMiddleware(proxyOptions(SERVICES.social, '/api/social')));

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Gateway Error' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        🚀 API GATEWAY RUNNING                  ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}           ║
║                                                ║
║  Services:                                     ║
║  ├─ Auth:         ${SERVICES.auth}          ║
║  ├─ User:         ${SERVICES.user}          ║
║  ├─ Library:      ${SERVICES.library}       ║
║  ├─ Gamification: ${SERVICES.gamification}  ║
║  └─ Social:       ${SERVICES.social}        ║
║                                                ║
║  Health: http://localhost:${PORT}/health        ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
*/

/*
// ============================================
// API GATEWAY - Book Club
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RATE LIMITING
// ============================================

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  }
});

// ============================================
// CONFIGURACIÓN DE SERVICIOS
// ============================================

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  library: process.env.LIBRARY_SERVICE_URL || 'http://localhost:3003',
  gamification: process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004',
  social: process.env.SOCIAL_SERVICE_URL || 'http://localhost:3005',
};

// ============================================
// OPCIONES DE PROXY
// ============================================

const proxyOptions = (target, context) => ({
  target,
  changeOrigin: true,
  pathRewrite: {
    [`^${context}`]: '', // elimina el prefijo (por ej. /api/auth -> /)
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] ${req.method} ${req.path} → ${target}`);
  },
  onError: (err, req, res) => {
    console.error(`[PROXY ERROR] ${err.message}`);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      service: target,
    });
  },
});

// ============================================
// HEALTH CHECK DEL GATEWAY
// ============================================

app.get('/health', async (req, res) => {
  const healthChecks = await Promise.allSettled([
    axios.get(`${SERVICES.auth}/health`).catch(() => ({ status: 'down' })),
    axios.get(`${SERVICES.user}/health`).catch(() => ({ status: 'down' })),
    axios.get(`${SERVICES.library}/health`).catch(() => ({ status: 'down' })),
  ]);

  const services = {
    auth: healthChecks[0].status === 'fulfilled' ? 'up' : 'down',
    user: healthChecks[1].status === 'fulfilled' ? 'up' : 'down',
    library: healthChecks[2].status === 'fulfilled' ? 'up' : 'down',
  };

  const allUp = Object.values(services).every(status => status === 'up');

  res.status(allUp ? 200 : 503).json({
    status: allUp ? 'ok' : 'degraded',
    gateway: 'api-gateway',
    timestamp: new Date().toISOString(),
    services
  });
});

// ============================================
// RUTAS PROXY A MICROSERVICIOS
// ============================================

// AUTH SERVICE
app.use('/api/auth/login', authLimiter, createProxyMiddleware(proxyOptions(SERVICES.auth, '/api/auth')));
app.use('/api/auth/register', authLimiter, createProxyMiddleware(proxyOptions(SERVICES.auth, '/api/auth')));
app.use('/api/auth', generalLimiter, createProxyMiddleware(proxyOptions(SERVICES.auth, '/api/auth')));

// USER SERVICE
app.use('/api/users', generalLimiter, createProxyMiddleware(proxyOptions(SERVICES.user, '/api/users')));

// LIBRARY SERVICE
app.use('/api/library', generalLimiter, createProxyMiddleware(proxyOptions(SERVICES.library, '/api/library')));

// GAMIFICATION SERVICE
app.use('/api/gamification', generalLimiter, createProxyMiddleware(proxyOptions(SERVICES.gamification, '/api/gamification')));

// SOCIAL SERVICE
app.use('/api/social', generalLimiter, createProxyMiddleware(proxyOptions(SERVICES.social, '/api/social')));

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal gateway error'
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        🚀 API GATEWAY RUNNING                  ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}            ║
║                                                ║
║  Services:                                     ║
║  ├─ Auth:         ${SERVICES.auth}          ║
║  ├─ User:         ${SERVICES.user}          ║
║  ├─ Library:      ${SERVICES.library}       ║
║  ├─ Gamification: ${SERVICES.gamification}  ║
║  └─ Social:       ${SERVICES.social}        ║
║                                                ║
║  Health: http://localhost:${PORT}/health        ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
*/



/*
// api-gateway/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// CORS - Permitir requests del frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging de requests
app.use(morgan('combined'));

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RATE LIMITING
// ============================================

// Rate limiter general (100 requests por 15 minutos)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter estricto para auth (5 intentos por 15 minutos)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  }
});

// ============================================
// CONFIGURACIÓN DE SERVICIOS
// ============================================

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  library: process.env.LIBRARY_SERVICE_URL || 'http://localhost:3003',
  gamification: process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3004',
  social: process.env.SOCIAL_SERVICE_URL || 'http://localhost:3005',
};

// ============================================
// OPCIONES DE PROXY
// ============================================

const proxyOptions = (target, context) => ({
  target,
  changeOrigin: true,
  pathRewrite: {
    [`^${context}`]: '', // elimina el prefijo /api/auth → /
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] ${req.method} ${req.path} → ${target}`);
  },
  onError: (err, req, res) => {
    console.error(`[PROXY ERROR] ${err.message}`);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      service: target,
    });
  },
});

// ============================================
// RUTAS PROXY A MICROSERVICIOS
// ============================================

// AUTH SERVICE
app.use('/api/auth', createProxyMiddleware(proxyOptions(SERVICES.auth, '/api/auth')));

// USER SERVICE
app.use('/api/users', createProxyMiddleware(proxyOptions(SERVICES.user, '/api/users')));

// LIBRARY SERVICE
app.use('/api/library', createProxyMiddleware(proxyOptions(SERVICES.library, '/api/library')));

// GAMIFICATION SERVICE
app.use('/api/gamification', createProxyMiddleware(proxyOptions(SERVICES.gamification, '/api/gamification')));

// SOCIAL SERVICE
app.use('/api/social', createProxyMiddleware(proxyOptions(SERVICES.social, '/api/social')));



// ============================================
// HEALTH CHECK DEL GATEWAY
// ============================================

app.get('/health', async (req, res) => {
  const axios = require('axios');
  
  const healthChecks = await Promise.allSettled([
    axios.get(`${SERVICES.auth}/health`).catch(() => ({ status: 'down' })),
    axios.get(`${SERVICES.user}/health`).catch(() => ({ status: 'down' })),
    axios.get(`${SERVICES.library}/health`).catch(() => ({ status: 'down' })),
  ]);

  const services = {
    auth: healthChecks[0].status === 'fulfilled' ? 'up' : 'down',
    user: healthChecks[1].status === 'fulfilled' ? 'up' : 'down',
    library: healthChecks[2].status === 'fulfilled' ? 'up' : 'down',
  };

  const allUp = Object.values(services).every(status => status === 'up');

  res.status(allUp ? 200 : 503).json({
    status: allUp ? 'ok' : 'degraded',
    gateway: 'api-gateway',
    timestamp: new Date().toISOString(),
    services
  });
});

// ============================================
// RUTAS PROXY A MICROSERVICIOS
// ============================================

// AUTH SERVICE (con rate limiting estricto)
app.use(
  '/api/auth/login',
  authLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.auth))
);

app.use(
  '/api/auth/register',
  authLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.auth))
);

app.use(
  '/api/auth',
  generalLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.auth))
);

// USER SERVICE
app.use(
  '/api/users',
  generalLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.user))
);

// LIBRARY SERVICE
app.use(
  '/api/library',
  generalLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.library))
);

// GAMIFICATION SERVICE (cuando esté listo)
app.use(
  '/api/gamification',
  generalLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.gamification))
);

// SOCIAL SERVICE (cuando esté listo)
app.use(
  '/api/social',
  generalLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.social))
);

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal gateway error'
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        🚀 API GATEWAY RUNNING                  ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}            ║
║                                                ║
║  Services:                                     ║
║  ├─ Auth:         ${SERVICES.auth}          ║
║  ├─ User:         ${SERVICES.user}          ║
║  ├─ Library:      ${SERVICES.library}       ║
║  ├─ Gamification: ${SERVICES.gamification}  ║
║  └─ Social:       ${SERVICES.social}        ║
║                                                ║
║  Health: http://localhost:${PORT}/health        ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
*/