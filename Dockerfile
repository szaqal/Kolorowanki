# Stage 1 – install deps and download Puppeteer's Chrome binary
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY app/package*.json ./
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer
RUN npm ci
RUN npx puppeteer browsers install chrome

# Stage 2 – build the Next.js app
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY app/ .
RUN npm run build

# Stage 3 – minimal production image
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Runtime libraries required by headless Chrome
RUN apt-get update && apt-get install -y --no-install-recommends \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libasound2 libpango-1.0-0 libcairo2 \
  libx11-6 libx11-xcb1 libxcb1 libxext6 libxrender1 \
  fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

# Standalone bundle + static assets + Puppeteer Chrome cache
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=deps /app/.cache ./.cache

EXPOSE 3000
CMD ["node", "server.js"]
