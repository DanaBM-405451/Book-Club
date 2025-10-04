
const { PrismaClient } = require('@prisma/client');

// Singleton pattern para Prisma Client
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Para usarlo en desarrollo, evitar múltiples instancias por hot-reload 
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'], // Logs útiles en desarrollo
    });
  }
  prisma = global.prisma;
}

// Manejo de desconexión
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;