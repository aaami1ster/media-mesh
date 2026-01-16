# Docker Build Guide

This document describes how to build Docker images for MediaMesh microservices.

## Overview

Each service has its own multi-stage Dockerfile optimized for production:
- **Build stage**: Compiles TypeScript, generates Prisma client, installs all dependencies
- **Production stage**: Minimal image with only production dependencies and built artifacts

## Services

All services use Node.js 20 Alpine base image for small image size:

| Service | Port | Dockerfile Location |
|---------|------|-------------------|
| api-gateway-cms | 8081 | `services/api-gateway-cms/Dockerfile` |
| api-gateway-discovery | 8080 | `services/api-gateway-discovery/Dockerfile` |
| auth-service | 8001 | `services/auth-service/Dockerfile` |
| cms-service | 8002 | `services/cms-service/Dockerfile` |
| metadata-service | 8003 | `services/metadata-service/Dockerfile` |
| media-service | 8004 | `services/media-service/Dockerfile` |
| ingest-service | 8005 | `services/ingest-service/Dockerfile` |
| discovery-service | 8092 | `services/discovery-service/Dockerfile` |
| search-service | 8091 | `services/search-service/Dockerfile` |

## Building Images

Since this is a monorepo, build from the **root directory** with the service-specific Dockerfile:

```bash
# Build a single service
docker build -f services/cms-service/Dockerfile -t mediamesh/cms-service:latest .

# Build all services
for service in api-gateway-cms api-gateway-discovery auth-service cms-service \
               metadata-service media-service ingest-service discovery-service \
               search-service; do
  docker build -f services/$service/Dockerfile -t mediamesh/$service:latest .
done
```

## Dockerfile Features

### Multi-Stage Builds
- **Builder stage**: Full development environment with build tools
- **Production stage**: Minimal runtime with only necessary files

### Optimizations
- ✅ Node.js 20 Alpine (small base image)
- ✅ Production dependencies only in final image
- ✅ Non-root user (nestjs:nodejs) for security
- ✅ Health checks configured
- ✅ Proper layer caching (package files copied first)
- ✅ Prisma client generation in build stage
- ✅ Shared module support

### Health Checks
All services include health checks:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:<PORT>/health || exit 1
```

## Prisma Services

Services using Prisma (cms, metadata, media, ingest, discovery, search, auth):
- Prisma client is generated during build stage
- Prisma schema and migrations are copied to production image
- Generated Prisma client (`node_modules/.prisma`) is copied to production

## Environment Variables

Services require environment variables for:
- Database connections (PostgreSQL)
- Redis configuration
- Kafka brokers
- Service URLs
- JWT secrets
- Object storage (S3/Spaces/MinIO)

Set these via:
- Docker Compose `environment` section
- Kubernetes ConfigMaps/Secrets
- `.env` files (development)

## Image Size Optimization

Expected image sizes (approximate):
- **API Gateways**: ~150-200 MB
- **Services with Prisma**: ~200-250 MB
- **Media Service** (with image processing): ~250-300 MB

## Security

- ✅ Non-root user execution
- ✅ Minimal attack surface (Alpine Linux)
- ✅ Production dependencies only
- ✅ No build tools in production image

## Troubleshooting

### Build fails with "Cannot find module"
- Ensure you're building from the **root directory**
- Verify `shared` module exists and is built
- Check that `package.json` files are in place

### Prisma client not found
- Verify Prisma schema exists in service directory
- Check that `prisma:generate` script runs successfully
- Ensure `node_modules/.prisma` is copied to production stage

### Health check fails
- Verify service exposes `/health` endpoint
- Check service port matches EXPOSE directive
- Ensure service starts successfully

## Example: Building and Running

```bash
# Build CMS service
docker build -f services/cms-service/Dockerfile -t mediamesh/cms-service:latest .

# Run with environment variables
docker run -d \
  --name cms-service \
  -p 8002:8002 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/cms_db" \
  -e KAFKA_BROKER="localhost:9092" \
  mediamesh/cms-service:latest

# Check health
curl http://localhost:8002/health
```

## Docker Compose

For orchestrated deployment, use `compose.yml` which references these Dockerfiles.
