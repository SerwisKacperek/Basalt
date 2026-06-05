FROM oven/bun:alpine AS pruner
WORKDIR /app
 
RUN apk add --no-cache nodejs npm
RUN bun add -g turbo
COPY . .
RUN turbo prune @basalt/backend --docker
 
FROM oven/bun:alpine AS installer
WORKDIR /app
 
RUN apk add --no-cache python3 make g++
 
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile
 
COPY --from=pruner /app/out/full/ .
 
FROM oven/bun:alpine AS runner
WORKDIR /app
 
ENV NODE_ENV=production
 
RUN apk add --no-cache libstdc++
 
COPY --from=installer /app .
 
EXPOSE 8000
 
CMD ["bun", "run", "apps/backend/src/index.ts"]
 