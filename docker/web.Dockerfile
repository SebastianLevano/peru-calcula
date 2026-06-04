# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY apps/web/package*.json ./
RUN npm ci --prefer-offline

COPY apps/web/ .

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# ── Stage 2: runtime SSR (Node.js Express) ───────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Solo las dependencias de producción que necesita Express
COPY --from=build /app/dist/web ./dist/web
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

RUN addgroup --system --gid 1001 appgroup && \
    adduser  --system --uid 1001 --ingroup appgroup appuser
USER appuser

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/web/server/server.mjs"]
