FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
# Configurar schema para PostgreSQL en contenedores de producción
RUN cp prisma/schema.postgresql.prisma prisma/schema.prisma 2>/dev/null || true
RUN npm ci
COPY tsconfig.json ./
COPY src ./src/
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]

