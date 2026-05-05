FROM node:20-alpine AS deps
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS build
COPY . /app/
COPY --from=deps /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build
