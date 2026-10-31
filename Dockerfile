# ShipItAyiti — production image (Next.js standalone server on Node 24).
# Build:  docker compose build    Run: docker compose up -d   (see docker-compose.yml)

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx next build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
# Next.js server and its traced dependencies
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
# Migration runner (applied on every start; already-applied migrations are skipped)
COPY --from=build --chown=app:app /app/db ./db
COPY --from=build --chown=app:app /app/scripts/migrate.mts ./scripts/migrate.mts
COPY --from=build --chown=app:app /app/src/lib/db/migrate.ts ./src/lib/db/migrate.ts
COPY --from=deps --chown=app:app /app/node_modules/postgres ./node_modules/postgres
COPY --chown=app:app docker-entrypoint.sh ./docker-entrypoint.sh
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/en >/dev/null || exit 1
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
