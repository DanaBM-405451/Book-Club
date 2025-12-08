// src/config/database.js
const { PrismaClient } = require('@prisma/client');

/**
 * Cliente de Prisma para interactuar con la base de datos
 * Configurado como singleton para evitar múltiples conexiones
 */

// Opciones de logging según el entorno
const prismaOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
};

// Instancia única de PrismaClient
const prisma = new PrismaClient(prismaOptions);

/**
 * Conectar a la base de datos
 */
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Social Service: Conectado a MySQL exitosamente');
  } catch (error) {
    console.error('❌ Social Service: Error conectando a la base de datos:', error);
    process.exit(1);
  }
};

/**
 * Desconectar de la base de datos
 */
const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log('🔌 Social Service: Desconectado de MySQL');
  } catch (error) {
    console.error('❌ Error desconectando de la base de datos:', error);
  }
};

/**
 * Manejo de señales de terminación
 */
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  prisma,
  connectDB,
  disconnectDB
};

/*

## 📂 PASO 2: Estructura de Carpetas
```
chat-service/
├── prisma/
│   └── schema.prisma (👆 el de arriba)
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── socket.js
│   ├── controllers/
│   │   ├── conversation.controller.js
│   │   └── message.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── friendship.middleware.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── conversation.routes.js
│   │   └── message.routes.js
│   ├── services/
│   │   ├── conversation.service.js
│   │   ├── message.service.js
│   │   ├── http/
│   │   │   ├── social.service.js (consulta a social-service)
│   │   │   └── user.service.js (consulta a user-service)
│   ├── socket/
│   │   ├── handlers/
│   │   │   ├── message.handler.js
│   │   │   ├── typing.handler.js
│   │   │   └── connection.handler.js
│   │   └── middlewares/
│   │       └── socketAuth.middleware.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── validators.js
│   └── app.js
├── .env
├── .env.example
├── package.json
└── docker-compose.yml (si usás Docker)
*/