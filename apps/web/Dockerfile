FROM oven/bun:1.3.13-alpine AS pruner
WORKDIR /app
 
RUN apk add --no-cache nodejs npm
RUN bun add -g turbo
COPY . .
RUN turbo prune web --docker
 
FROM oven/bun:1.3.13-alpine AS builder
WORKDIR /app
 
RUN apk add --no-cache python3 make g++
 
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile
 
COPY --from=pruner /app/out/full/ .
 
RUN bun run build --filter=web
 
FROM nginx:alpine AS runner
 
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

COPY services/nginx/nginx.conf /etc/nginx/conf.d/default.conf
 
EXPOSE 80
EXPOSE 443