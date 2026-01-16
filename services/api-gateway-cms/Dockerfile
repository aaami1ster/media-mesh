# Multi-stage build for CMS API Gateway
# Port: 8081

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
COPY services/api-gateway-cms ./services/api-gateway-cms

# Install dependencies
RUN npm ci

# Build the service
WORKDIR /app/services/api-gateway-cms
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
COPY --from=builder /app/services/api-gateway-cms/dist ./services/api-gateway-cms/dist
COPY --from=builder /app/services/api-gateway-cms/package.json ./services/api-gateway-cms/package.json

# Set working directory to service
WORKDIR /app/services/api-gateway-cms

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose service port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8081/health || exit 1

# Start the service
CMD ["node", "dist/main"]
