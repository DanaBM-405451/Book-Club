// user-service/src/middlewares/auth.middleware.js

const axios = require('axios');

/**
 * Middleware de autenticación
 * Verifica el token contra auth-service e inyecta el usuario en req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    try {
      const response = await axios.post(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
        { token },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 
        }
      );

      if (response.data.success && response.data.data.user) {
        // ✅ MEJORA: Guardamos el objeto completo que viene de auth-service
        const userData = response.data.data.user;
        
        req.user = userData; 
        
        // ✅ COMPATIBILIDAD: Aseguramos que existan ambas formas de llamar al ID
        // Algunos controladores usan req.user.id, otros req.user.userId
        req.user.userId = userData.id; 

        next();
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token structure'
        });
      }

    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }
      console.error('Error connecting to auth-service:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Authentication service unavailable',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Middleware para requerir rol de ADMIN
 * Debe usarse DESPUÉS de authenticate
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.',
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireAdmin
};


/**
 * PROPÓSITO:
 * - Verificar que el usuario está autenticado antes de acceder a rutas protegidas
 * - Extraer información del usuario desde el JWT
 * - Validar el token con el auth-service
 * 
 * FLUJO DE AUTENTICACIÓN EN MICROSERVICIOS:
 * 1. Usuario hace login en auth-service → recibe JWT
 * 2. Usuario envía request a user-service con JWT en header
 * 3. Este middleware intercepta el request
 * 4. Verifica el JWT (puede hacerlo localmente o llamando a auth-service)
 * 5. Si es válido, extrae userId y lo adjunta a req.user
 * 6. El controller puede usar req.user.userId para saber quién hizo el request
 *

const axios = require('axios');

**
 * MIDDLEWARE: Autenticar con JWT
 * 
 * OPCIONES DE IMPLEMENTACIÓN:
 * 
 * Opción A: Verificar JWT localmente (más rápido)
 * - Pro: No hace llamada HTTP, más rápido
 * - Con: Necesita tener JWT_SECRET compartido entre servicios
 * - Con: Si revocas un token en auth-service, este servicio no se entera
 * 
 * Opción B: Validar con auth-service (más seguro - USAMOS ESTA)
 * - Pro: auth-service es la fuente de verdad
 * - Pro: Revocación de tokens funciona inmediatamente
 * - Con: Llamada HTTP adicional (puede ser lenta)
 * 
 * MEJORA FUTURA: Cache de tokens válidos en Redis
 * - Verificar en Redis primero
 * - Si no está, consultar auth-service
 * - Guardar en Redis por 15 minutos (expiración del access token)
 *

const authenticate = async (req, res, next) => {
  try {
    // 1. Extraer token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7); // Remover "Bearer "
    
    // 2. Validar token con auth-service
    try {
      const response = await axios.post(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
        { token },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 // 5 segundos máximo
        }
      );
      
      // 3. Si el token es válido, adjuntar info del usuario al request
      if (response.data.success && response.data.data.user) {
        req.user = {
          userId: response.data.data.user.id,
          email: response.data.data.user.email,
          username: response.data.data.user.username,
          role: response.data.data.user.role
        };
        
        next(); // Continuar al siguiente middleware/controller
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    } catch (error) {
      // Error al comunicarse con auth-service
      if (error.response) {
        // auth-service respondió con error
        return res.status(401).json({
          success: false,
          message: error.response.data.message || 'Invalid token'
        });
      } else {
        // auth-service no responde (está caído, timeout, etc.)
        console.error('Auth service error:', error.message);
        return res.status(503).json({
          success: false,
          message: 'Authentication service unavailable'
        });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

**
 * MIDDLEWARE: Verificar rol (solo para admins)
 * 
 * USO:
 * router.get('/admin/users', authenticate, requireAdmin, controller.getAllUsers);
 * 
 * FLUJO:
 * 1. authenticate se ejecuta primero (verifica JWT)
 * 2. req.user ya tiene la info del usuario
 * 3. requireAdmin verifica que user.role === 'ADMIN'
 * 4. Si no es admin, devuelve 403 Forbidden
 *
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  requireAdmin
};*/