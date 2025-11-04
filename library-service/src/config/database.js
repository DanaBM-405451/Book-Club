// library-service/src/config/database.js

// library-service/src/config/database.js

const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;

/**
 * PROPÓSITO:
 * - Crear una única instancia de PrismaClient (Singleton Pattern)
 * - Evitar múltiples conexiones a la base de datos
 * - Optimizar el uso de recursos
 * 
 * POR QUÉ SINGLETON:
 * En desarrollo, nodemon reinicia el servidor cada vez que guardas un archivo.
 * Sin singleton: cada reinicio crea una NUEVA conexión a MySQL
 * Resultado: "Too many connections" error
 * 
 * Con singleton: reutilizamos la misma conexión en la variable global
 */
/*t { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  // PRODUCCIÓN: Una sola instancia
  // En producción no hay hot-reload, así que no hay riesgo de múltiples instancias
  prisma = new PrismaClient();
} else {
  // DESARROLLO: Reutilizar instancia en variable global
  // global.prisma persiste entre hot-reloads de nodemon
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'], // Ver queries en consola para debugging
    });
  }
  prisma = global.prisma;
}

/**
 * MANEJO DE DESCONEXIÓN LIMPIA:
 * Cuando el proceso Node.js termina (Ctrl+C, error fatal, etc.),
 * cerrar correctamente la conexión a la BD para evitar conexiones huérfanas
 */


/*
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;

*/