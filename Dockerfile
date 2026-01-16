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

# Copy package files and workspace structure for npm to resolve dependencies
COPY package*.json ./
COPY tsconfig*.json ./

# Copy shared module package.json
COPY shared/package.json ./shared/package.json

# Copy all service package.json files (needed for npm workspaces to resolve dependencies)
COPY services/api-gateway-discovery/package.json ./services/api-gateway-discovery/package.json
COPY services/api-gateway-cms/package.json ./services/api-gateway-cms/package.json
COPY services/auth-service/package.json ./services/auth-service/package.json
COPY services/cms-service/package.json ./services/cms-service/package.json
COPY services/metadata-service/package.json ./services/metadata-service/package.json
COPY services/media-service/package.json ./services/media-service/package.json
COPY services/ingest-service/package.json ./services/ingest-service/package.json
COPY services/discovery-service/package.json ./services/discovery-service/package.json
COPY services/search-service/package.json ./services/search-service/package.json

# Install production dependencies (npm workspaces will resolve all workspace dependencies)
RUN npm ci --only=production && npm cache clean --force

# Copy built applications (dist only) from builder stage
# Copy each service's dist directory
COPY --from=builder /app/services/api-gateway-discovery/dist ./services/api-gateway-discovery/dist
COPY --from=builder /app/services/api-gateway-cms/dist ./services/api-gateway-cms/dist
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/cms-service/dist ./services/cms-service/dist
COPY --from=builder /app/services/metadata-service/dist ./services/metadata-service/dist
COPY --from=builder /app/services/media-service/dist ./services/media-service/dist
COPY --from=builder /app/services/ingest-service/dist ./services/ingest-service/dist
COPY --from=builder /app/services/discovery-service/dist ./services/discovery-service/dist
COPY --from=builder /app/services/search-service/dist ./services/search-service/dist
# Copy shared module dist (package.json main field points to dist/index.js)
COPY --from=builder /app/shared/dist ./shared/dist

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
