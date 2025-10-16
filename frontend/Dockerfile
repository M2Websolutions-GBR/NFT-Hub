# syntax=docker/dockerfile:1.7

########### Build Stage ###########
FROM node:20-alpine AS build
WORKDIR /app

# Paketmanager-Caches nutzen & deterministic install
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.yarn \
    --mount=type=cache,target=/root/.pnpm-store \
    sh -c '\
      if [ -f package-lock.json ]; then npm ci; \
      elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
      elif [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile; \
      else npm i; fi \
    '

# Rest kopieren & builden
COPY . .
# Optional: API-Base zur Buildzeit setzen (Default: /api)
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

########### Runtime Stage ###########
FROM nginx:alpine

# Nginx-Config (SPA-Fallback & /health)
COPY ./nginx/config/frontend.conf /etc/nginx/conf.d/default.conf

# Gebaute App deployen
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx läuft standardmäßig als "nginx" User; sichere Rechte
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

# Healthcheck: liefert 200 auf /health (siehe nginx conf)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/health || exit 1

# Fertig. Nginx startet per default über das Base-Image.
