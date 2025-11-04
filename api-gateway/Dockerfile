# Usa una imagen ligera de Node.js
FROM node:18-alpine

# Crea el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias primero (para aprovechar la cache)
COPY package*.json ./

# Instala dependencias de desarrollo (incluye nodemon)
RUN npm install

# Copia el resto del código de la app
COPY . .

# Instala nodemon globalmente para que esté disponible como comando
RUN npm install -g nodemon

# Crea un usuario no root para mayor seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S gatewayuser -u 1001

# Ajusta permisos para ese usuario
RUN chown -R gatewayuser:nodejs /app

# Cambia al usuario no root
USER gatewayuser

# Expone el puerto en el que corre la app
EXPOSE 8082

ENV NODE_ENV=docker

# Ejecuta el servidor en modo desarrollo
CMD ["npm", "run", "dev"]

