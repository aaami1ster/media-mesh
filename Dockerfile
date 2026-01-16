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

# Generate Prisma clients for all services that use Prisma
# This must happen before building the services
# Each service generates its own Prisma client
WORKDIR /app/services/auth-service
RUN npm run prisma:generate
WORKDIR /app/services/cms-service
RUN npm run prisma:generate
WORKDIR /app/services/metadata-service
RUN npm run prisma:generate
WORKDIR /app/services/media-service
RUN npm run prisma:generate
WORKDIR /app/services/ingest-service
RUN npm run prisma:generate
WORKDIR /app/services/discovery-service
RUN npm run prisma:generate
WORKDIR /app/services/search-service
RUN npm run prisma:generate
WORKDIR /app

# Build all services
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl, wget, and OpenSSL for health checks and Prisma
# Prisma query engine requires OpenSSL libraries
# Note: Prisma will use OpenSSL 3.0 binary if available (from binaryTargets in schema)
RUN apk add --no-cache curl wget openssl

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

# Copy Prisma schemas and generated clients for services that use Prisma
# Note: In npm workspaces, Prisma generates to root node_modules/.prisma
# Copy the entire .prisma directory structure including query engine binaries
# This must happen AFTER npm ci to avoid overwriting
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

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

# Copy Prisma schemas and generated clients for services that use Prisma
# Note: In npm workspaces, Prisma generates to root node_modules/.prisma
# Copy the entire .prisma directory structure including query engine binaries
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Also ensure @prisma/client package is available (should be in node_modules from npm ci)

# Copy Prisma schema files
COPY --from=builder /app/services/auth-service/prisma ./services/auth-service/prisma
COPY --from=builder /app/services/cms-service/prisma ./services/cms-service/prisma
COPY --from=builder /app/services/metadata-service/prisma ./services/metadata-service/prisma
COPY --from=builder /app/services/media-service/prisma ./services/media-service/prisma
COPY --from=builder /app/services/ingest-service/prisma ./services/ingest-service/prisma
COPY --from=builder /app/services/discovery-service/prisma ./services/discovery-service/prisma
COPY --from=builder /app/services/search-service/prisma ./services/search-service/prisma

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
