FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
# Copy workspace package manifests first for better layer caching
FROM base AS deps
COPY package.json bun.lock ./
COPY packages/api/package.json ./packages/api/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/cli/package.json ./packages/cli/
RUN bun install --frozen-lockfile

# Copy source and generate Prisma client
FROM deps AS build
COPY packages/api ./packages/api
COPY packages/contracts ./packages/contracts
RUN cd packages/api && DATABASE_URL=postgresql://dummy/dummy bunx prisma generate

# Production image
FROM base AS release
COPY --from=build /app .
USER bun
EXPOSE 3000
ENTRYPOINT ["sh", "-c", "cd /app/packages/api && bunx prisma migrate deploy && exec bun src/main.ts"]
