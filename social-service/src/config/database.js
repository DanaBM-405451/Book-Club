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


// src/config/database.js
/*
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Manejar desconexión al cerrar la aplicación
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
*/

// social-service/src/config/database.js


/*const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Manejo de errores de conexión
prisma.$connect()
  .then(() => {
    console.log('✅ Conectado a social_db');
  })
  .catch((error) => {
    console.error('❌ Error conectando a social_db:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
*/