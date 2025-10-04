FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN addgroup -g 1001 -S nodejs && adduser -S gatewayuser -u 1001
RUN chown -R gatewayuser:nodejs /app
USER gatewayuser

EXPOSE 8080

CMD ["npm", "run", "dev"]
