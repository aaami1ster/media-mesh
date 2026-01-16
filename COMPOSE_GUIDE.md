# Docker Compose Guide

MediaMesh supports two Docker Compose configurations for different use cases.

## Files

- **`compose.yml`** - Development (uses root Dockerfile, backward compatible)
- **`compose.dev.yml`** - Development (explicit, uses root Dockerfile)
- **`compose.prod.yml`** - Production (uses individual Dockerfiles)

## Quick Start

### Development

```bash
# Using default compose.yml (backward compatible)
docker compose up

# Or explicitly use dev compose
docker compose -f compose.dev.yml up

# Build and start
docker compose -f compose.dev.yml up --build
```

### Production

```bash
# Build all service images
docker compose -f compose.prod.yml build

# Start services
docker compose -f compose.prod.yml up -d

# With version tag
VERSION=v1.0.0 docker compose -f compose.prod.yml up -d
```

## Differences

### Development (`compose.dev.yml`)

- ✅ **Single Image**: All services built into one `mediamesh:latest` image
- ✅ **Fast Build**: One build for all services (~5-10 minutes)
- ✅ **Simple**: Easy to use, less configuration
- ✅ **Ports**: Uses standard ports (8001-8005, 8080-8081, 8091-8092)
- ✅ **Environment**: `NODE_ENV=development`
- ✅ **Best For**: Local development, testing, quick iteration

**Build Command:**
```bash
docker compose -f compose.dev.yml build
```

**Service Selection:**
Each service uses the same image but different `command:` to run specific service:
```yaml
auth-service:
  image: mediamesh:latest
  command: node services/auth-service/dist/main.js
```

### Production (`compose.prod.yml`)

- ✅ **Individual Images**: Each service has its own optimized image
- ✅ **Optimized**: Smaller images (~150-300 MB each vs ~500-800 MB)
- ✅ **Independent**: Scale and update services independently
- ✅ **Versioned**: Support for version tags (`mediamesh/cms-service:v1.0.0`)
- ✅ **Environment**: `NODE_ENV=production`
- ✅ **Security**: Smaller attack surface per service
- ✅ **Best For**: Production deployments, Kubernetes, CI/CD

**Build Command:**
```bash
docker compose -f compose.prod.yml build
```

**Service Images:**
Each service has its own image:
```yaml
cms-service:
  build:
    context: .
    dockerfile: services/cms-service/Dockerfile
  image: mediamesh/cms-service:${VERSION:-latest}
```

## Service Ports

Both configurations use the same ports:

| Service | Port |
|---------|------|
| Auth Service | 8001 |
| CMS Service | 8002 |
| Metadata Service | 8003 |
| Media Service | 8004 |
| Ingest Service | 8005 |
| Discovery Gateway | 8080 |
| CMS Gateway | 8081 |
| Search Service | 8091 |
| Discovery Service | 8092 |

## Environment Variables

### Development

Default values are provided for quick setup:
```yaml
NODE_ENV: development
JWT_SECRET: dev-secret-key-change-in-production
POSTGRES_PASSWORD: postgres
```

### Production

**Required** environment variables (set via `.env` or export):
```bash
# Security
JWT_SECRET=<strong-random-secret>
POSTGRES_PASSWORD=<secure-password>
REDIS_PASSWORD=<secure-password>

# Object Storage (Media Service)
S3_ENDPOINT=<your-s3-endpoint>
S3_ACCESS_KEY=<access-key>
S3_SECRET_KEY=<secret-key>
S3_BUCKET=<bucket-name>
S3_REGION=<region>

# Versioning (optional)
VERSION=v1.0.0
```

Create `.env.prod` file:
```bash
JWT_SECRET=your-production-secret-here
POSTGRES_PASSWORD=secure-password
REDIS_PASSWORD=secure-password
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
S3_BUCKET=mediamesh-media
VERSION=v1.0.0
```

Load with:
```bash
docker compose -f compose.prod.yml --env-file .env.prod up
```

## Common Commands

### Development

```bash
# Start all services
docker compose -f compose.dev.yml up

# Start in background
docker compose -f compose.dev.yml up -d

# View logs
docker compose -f compose.dev.yml logs -f

# Stop services
docker compose -f compose.dev.yml down

# Rebuild and restart
docker compose -f compose.dev.yml up --build
```

### Production

```bash
# Build all images
docker compose -f compose.prod.yml build

# Build specific service
docker compose -f compose.prod.yml build cms-service

# Start all services
docker compose -f compose.prod.yml up -d

# View logs
docker compose -f compose.prod.yml logs -f cms-service

# Scale a service
docker compose -f compose.prod.yml up -d --scale cms-service=3

# Stop services
docker compose -f compose.prod.yml down

# Remove volumes (careful!)
docker compose -f compose.prod.yml down -v
```

## Migration from Development to Production

1. **Build production images:**
   ```bash
   docker compose -f compose.prod.yml build
   ```

2. **Set environment variables:**
   ```bash
   export JWT_SECRET=<your-secret>
   export POSTGRES_PASSWORD=<secure-password>
   # ... other vars
   ```

3. **Start production services:**
   ```bash
   docker compose -f compose.prod.yml up -d
   ```

4. **Verify health:**
   ```bash
   docker compose -f compose.prod.yml ps
   curl http://localhost:8080/health
   ```

## Troubleshooting

### Build Fails

**Error**: `Cannot find module '@mediamesh/shared'`
- **Solution**: Ensure you're building from the **root directory**
- **Check**: `ls shared/` should show the shared module

**Error**: `Prisma client not found`
- **Solution**: Prisma services need `prisma:generate` in Dockerfile
- **Check**: Verify Dockerfile includes Prisma generation step

### Services Won't Start

**Error**: `Connection refused` to database
- **Solution**: Wait for postgres health check to pass
- **Check**: `docker compose ps` shows postgres as healthy

**Error**: `Port already in use`
- **Solution**: Stop conflicting services or change ports
- **Check**: `lsof -i :8002` to see what's using the port

### Health Checks Failing

**Error**: Health check fails repeatedly
- **Solution**: Check service logs: `docker compose logs <service>`
- **Check**: Verify service exposes `/health` endpoint
- **Check**: Ensure service port matches EXPOSE in Dockerfile

## Best Practices

### Development
- ✅ Use `compose.dev.yml` for local development
- ✅ Keep default passwords for convenience
- ✅ Use volume mounts for hot-reload (if needed)
- ✅ Enable debug logging

### Production
- ✅ Use `compose.prod.yml` for production
- ✅ Set strong passwords and secrets
- ✅ Use version tags for images
- ✅ Enable health checks
- ✅ Use resource limits
- ✅ Set up monitoring and logging
- ✅ Use secrets management (Docker secrets, Vault, etc.)

## Next Steps

- **Kubernetes**: Use individual Dockerfiles for Kubernetes deployments
- **CI/CD**: Build and push individual images to registry
- **Scaling**: Scale services independently based on load
- **Monitoring**: Set up Prometheus, Grafana, or similar
- **Logging**: Configure centralized logging (ELK, Loki, etc.)
