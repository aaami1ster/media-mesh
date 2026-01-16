# Multi-stage build for CMS Service
# Port: 8002

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy root package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy shared module
COPY shared ./shared

# Copy service files
COPY services/cms-service ./services/cms-service

# Install dependencies
RUN npm ci

# Generate Prisma client
WORKDIR /app/services/cms-service
RUN npm run prisma:generate

# Build the service
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies for health checks
RUN apk add --no-cache curl

# Copy root package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy shared module (production)
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

# Copy service built files
COPY --from=builder /app/services/cms-service/dist ./services/cms-service/dist
COPY --from=builder /app/services/cms-service/package.json ./services/cms-service/package.json
COPY --from=builder /app/services/cms-service/prisma ./services/cms-service/prisma
COPY --from=builder /app/services/cms-service/node_modules/.prisma ./services/cms-service/node_modules/.prisma

# Set working directory to service
WORKDIR /app/services/cms-service

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nestjs -u 1001 && \
  chown -R nestjs:nodejs /app

USER nestjs

# Expose service port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8002/health || exit 1

# Start the service
CMD ["node", "dist/main"]
