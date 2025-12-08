# email-service/Dockerfile

FROM node:18-alpine

# Instalar dependencias del sistema para Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate

COPY . .

EXPOSE 3021

CMD ["npm", "run", "dev"]