FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app .
EXPOSE 4000
CMD ["node", "server.js"]
