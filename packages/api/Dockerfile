# syntax=docker/dockerfile:1.7
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install all deps (needed for prisma generate)
FROM base AS deps
COPY package.json bun.lock ./
COPY --parents packages/*/package.json ./
RUN bun install --frozen-lockfile

# Copy source and generate Prisma client
FROM deps AS build
COPY packages/api ./packages/api
COPY packages/contracts ./packages/contracts
RUN cd packages/api && DATABASE_URL=postgresql://dummy/dummy bunx prisma generate

# Production image — install prod deps only, then layer in generated prisma client
FROM base AS release
COPY package.json bun.lock ./
COPY --parents packages/*/package.json ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/packages/api ./packages/api
COPY --from=build /app/packages/contracts ./packages/contracts
USER bun
EXPOSE 3000
ENTRYPOINT ["sh", "-c", "cd /app/packages/api && bunx prisma migrate deploy && exec bun src/main.ts"]
