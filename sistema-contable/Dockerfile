# ============================================================================
# Dockerfile — Club Andino Águila Azul · Sistema Contable
# Target: Google Cloud Run (multi-stage, Next.js standalone)
# ============================================================================

# Etapa 1: Dependencias base
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Etapa 2: Instalar dependencias de producción y desarrollo
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Etapa 3: Build de la aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Variables necesarias en build time (valores placeholder; los reales van en Cloud Run)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Etapa 4: Runtime mínimo
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos estáticos públicos
COPY --from=builder /app/public ./public

# Copiar el build standalone (incluye todo lo necesario para ejecutar)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar el schema de Prisma (necesario en runtime para migraciones/seed)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

# Cloud Run inyecta PORT automáticamente (default 8080)
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
