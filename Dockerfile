# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy shared module
COPY shared ./shared

# Copy all service directories
COPY services ./services

# Install dependencies
RUN npm ci

# Build all services
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl and wget for health checks
RUN apk add --no-cache curl wget

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built applications from builder stage
COPY --from=builder /app/services ./services
COPY --from=builder /app/shared ./shared

# Set environment variables
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose default port (will be overridden by compose)
EXPOSE 3000

# Default command (will be overridden by compose)
CMD ["node", "--version"]
