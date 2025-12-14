# MQT Application - Node.js Single-Stage Build
FROM node:20-alpine

WORKDIR /app

# Install system dependencies for Sharp (image processing)
RUN apk add --no-cache \
    libc6-compat \
    vips-dev

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Environment variables
ENV PORT=8080
ENV NODE_ENV=production
# Force standard output to be unbuffered (logs show up immediately)
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["npm", "start"]

