# MediaMesh Deployment Guide

Complete deployment guide for MediaMesh microservices platform.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Docker Compose Deployment](#docker-compose-deployment)
- [PM2 Deployment](#pm2-deployment)
- [Environment Variables](#environment-variables)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)
- [Production Checklist](#production-checklist)

---

## Overview

MediaMesh can be deployed using two methods:

1. **Docker Compose** - Recommended for containerized deployments
2. **PM2** - Recommended for local development and process management

Both methods support development and production configurations.

---

## Prerequisites

### Required Software

- **Node.js 20+**
- **Docker** and **Docker Compose** (for Docker deployment)
- **PM2** (for PM2 deployment): `npm install -g pm2`
- **PostgreSQL 16+** (or use Docker Compose)
- **Redis 7+** (or use Docker Compose)
- **Kafka** (or use Docker Compose)

### Infrastructure Requirements

**Development:**
- 4 CPU cores
- 8GB RAM
- 20GB disk space

**Production:**
- 8+ CPU cores
- 16GB+ RAM
- 100GB+ disk space
- Load balancer (ALB, NLB, or similar)

---

## Docker Compose Deployment

### Quick Start

#### Development

```bash
# 1. Clone repository
git clone <repository-url>
cd mediamesh

# 2. Copy environment file
cp .env.development .env

# 3. Start all services
docker compose -f compose.dev.yml up -d

# 4. Check status
docker compose -f compose.dev.yml ps

# 5. View logs
docker compose -f compose.dev.yml logs -f
```

#### Production

```bash
# 1. Clone repository
git clone <repository-url>
cd mediamesh

# 2. Copy and configure environment
cp .env.production .env
# Edit .env and replace all CHANGE_THIS_* values

# 3. Build images
docker compose -f compose.prod.yml build

# 4. Start services
docker compose -f compose.prod.yml up -d

# 5. Verify health
docker compose -f compose.prod.yml ps
```

### Service Startup Order

Services start in the following order:

1. **Infrastructure** (postgres, redis, broker)
2. **Microservices** (auth, cms, metadata, media, ingest, discovery, search)
3. **Gateways** (discovery-gateway, cms-gateway)

### Building Images

#### Development (Single Image)

```bash
# Build root image
docker build -t mediamesh:latest .

# Or use compose
docker compose -f compose.dev.yml build
```

#### Production (Individual Images)

```bash
# Build all services
docker compose -f compose.prod.yml build

# Build specific service
docker compose -f compose.prod.yml build cms-service

# Build with version tag
VERSION=v1.0.0 docker compose -f compose.prod.yml build
```

### Managing Services

```bash
# Start all services
docker compose -f compose.dev.yml up -d

# Stop all services
docker compose -f compose.dev.yml down

# Restart specific service
docker compose -f compose.dev.yml restart cms-service

# View logs
docker compose -f compose.dev.yml logs -f cms-service

# Scale service
docker compose -f compose.dev.yml up -d --scale discovery-service=3

# Remove volumes (careful!)
docker compose -f compose.dev.yml down -v
```

### Health Checks

All services include health checks. Monitor with:

```bash
# Check service health
docker compose -f compose.dev.yml ps

# Test health endpoint
curl http://localhost:8080/health
```

### Networking

All services are on the `mediamesh-network` bridge network:
- Services communicate using service names as hostnames
- Example: `http://cms-service:8002`

---

## PM2 Deployment

### Quick Start

#### Development

```bash
# 1. Start infrastructure
docker compose up -d postgres redis broker

# 2. Install dependencies
npm install

# 3. Build all services
npm run build

# 4. Load environment variables
export $(cat .env.development | xargs)

# 5. Start all services
pm2 start ecosystem.config.js

# 6. Check status
pm2 status

# 7. View logs
pm2 logs
```

#### Production

```bash
# 1. Start infrastructure
docker compose up -d postgres redis broker

# 2. Install dependencies
npm install --production

# 3. Build all services
npm run build

# 4. Load environment variables
export $(cat .env.production | xargs)

# 5. Start in production mode
pm2 start ecosystem.config.js --env production

# 6. Save process list
pm2 save

# 7. Setup startup script
pm2 startup
# Follow the instructions shown
```

### Service Management

```bash
# Start all services
pm2 start ecosystem.config.js

# Start specific service
pm2 start ecosystem.config.js --only cms-service

# Stop all services
pm2 stop all

# Restart all services
pm2 restart all

# Reload (zero-downtime for cluster mode)
pm2 reload discovery-gateway

# Delete service
pm2 delete cms-service

# View logs
pm2 logs
pm2 logs cms-service

# Monitor resources
pm2 monit
```

### Scaling Services

```bash
# Scale discovery-gateway to 4 instances
pm2 scale discovery-gateway 4

# Scale down
pm2 scale discovery-gateway 2

# Scale all cluster mode services
pm2 scale discovery-gateway 4
pm2 scale discovery-service 3
```

### Logs

PM2 logs are stored in `./logs/` directory:

```bash
# View all logs
pm2 logs

# View specific service
pm2 logs cms-service

# Follow logs
pm2 logs --follow

# Last 100 lines
pm2 logs --lines 100

# Error logs only
pm2 logs --err
```

### Monitoring

```bash
# Real-time monitoring
pm2 monit

# Detailed service info
pm2 show cms-service

# Process list
pm2 list

# Memory usage
pm2 list --sort memory
```

---

## Environment Variables

### Quick Reference

See [ENV_CONFIGURATION.md](./ENV_CONFIGURATION.md) for complete reference.

### Required Variables

**All Services:**
- `NODE_ENV` - Environment mode
- `PORT` - Service port
- `DATABASE_URL` - PostgreSQL connection string

**Services with Redis:**
- `REDIS_HOST` - Redis hostname
- `REDIS_PORT` - Redis port

**Services with Kafka:**
- `KAFKA_BROKER` - Kafka broker address
- `KAFKA_CLIENT_ID` - Client identifier

**Services with JWT:**
- `JWT_SECRET` - JWT signing secret (MUST be strong)

**Media Service:**
- `STORAGE_PROVIDER` - S3, SPACES, or MINIO
- `STORAGE_ACCESS_KEY_ID` - Object storage access key
- `STORAGE_SECRET_ACCESS_KEY` - Object storage secret key
- `STORAGE_BUCKET` - Bucket name

### Environment Files

- **`.env.example`** - Template with all variables
- **`.env.development`** - Development defaults
- **`.env.production`** - Production template

### Loading Environment Variables

**Docker Compose:**
```bash
# Automatically loads .env file
docker compose up

# Use specific file
docker compose --env-file .env.production up
```

**PM2:**
```bash
# Export from file
export $(cat .env.development | xargs)
pm2 start ecosystem.config.js

# Or use dotenv-cli
dotenv -e .env.development -- pm2 start ecosystem.config.js
```

---

## Health Checks

### Health Check Endpoints

All services expose a `/health` endpoint:

| Service | Health Endpoint | Port |
|---------|----------------|------|
| Discovery Gateway | `http://localhost:8080/health` | 8080 |
| CMS Gateway | `http://localhost:8081/health` | 8081 |
| Auth Service | `http://localhost:8001/health` | 8001 |
| CMS Service | `http://localhost:8002/health` | 8002 |
| Metadata Service | `http://localhost:8003/health` | 8003 |
| Media Service | `http://localhost:8004/health` | 8004 |
| Ingest Service | `http://localhost:8005/health` | 8005 |
| Discovery Service | `http://localhost:8092/health` | 8092 |
| Search Service | `http://localhost:8091/health` | 8091 |

### Health Check Response

**Healthy:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-16T12:00:00.000Z",
  "service": "cms-service",
  "version": "1.0.0"
}
```

**Unhealthy:**
```json
{
  "status": "error",
  "message": "Database connection failed",
  "timestamp": "2024-01-16T12:00:00.000Z"
}
```

### Monitoring Health

**Docker Compose:**
```bash
# Check all services
docker compose ps

# Test health endpoint
curl http://localhost:8080/health
```

**PM2:**
```bash
# Check process status
pm2 status

# Test health endpoint
curl http://localhost:8080/health
```

**Automated Monitoring:**
```bash
# Health check script
#!/bin/bash
services=("8080:discovery-gateway" "8081:cms-gateway" "8001:auth-service")
for service in "${services[@]}"; do
  IFS=':' read -r port name <<< "$service"
  if curl -f http://localhost:$port/health > /dev/null 2>&1; then
    echo "✓ $name is healthy"
  else
    echo "✗ $name is unhealthy"
  fi
done
```

---

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

**Symptoms:**
- Service exits immediately
- Container keeps restarting
- PM2 shows "errored" status

**Solutions:**
```bash
# Check logs
docker compose logs cms-service
# or
pm2 logs cms-service

# Verify dependencies are running
docker compose ps
# or
pm2 status

# Check port conflicts
lsof -i :8002

# Verify environment variables
docker compose exec cms-service env
# or
pm2 show cms-service
```

#### 2. Database Connection Failed

**Symptoms:**
- "Connection refused" errors
- "Authentication failed" errors
- Service can't connect to database

**Solutions:**
```bash
# Verify PostgreSQL is running
docker compose ps postgres

# Test connection
docker compose exec postgres psql -U postgres -d cms_db

# Check DATABASE_URL
echo $DATABASE_URL

# Verify network connectivity
docker compose exec cms-service ping postgres
```

#### 3. Redis Connection Failed

**Symptoms:**
- "Connection refused" to Redis
- Rate limiting not working
- Cache not functioning

**Solutions:**
```bash
# Verify Redis is running
docker compose ps redis

# Test connection
docker compose exec redis redis-cli ping

# Check Redis configuration
echo $REDIS_HOST
echo $REDIS_PORT
```

#### 4. Kafka Connection Failed

**Symptoms:**
- Events not being published
- Consumer not receiving messages
- "Broker not available" errors

**Solutions:**
```bash
# Verify Kafka is running
docker compose ps broker

# Check Kafka logs
docker compose logs broker

# Test connection
docker compose exec broker kafka-broker-api-versions --bootstrap-server localhost:9092

# Verify topics exist
docker compose exec broker kafka-topics --list --bootstrap-server localhost:9092
```

#### 5. Port Already in Use

**Symptoms:**
- "Address already in use" error
- Service fails to bind to port

**Solutions:**
```bash
# Find process using port
lsof -i :8002

# Kill process
kill -9 <PID>

# Or change port in environment
PORT=8006 pm2 start ecosystem.config.js --only cms-service
```

#### 6. Health Check Failing

**Symptoms:**
- Health endpoint returns error
- Service marked as unhealthy

**Solutions:**
```bash
# Check service logs
docker compose logs cms-service

# Test health endpoint manually
curl -v http://localhost:8002/health

# Verify service is listening
netstat -tuln | grep 8002

# Check service startup time
# Increase start_period in compose file if needed
```

#### 7. Out of Memory

**Symptoms:**
- Service crashes
- "JavaScript heap out of memory" errors
- PM2 restarts service frequently

**Solutions:**
```bash
# Check memory usage
pm2 monit
# or
docker stats

# Increase memory limit
# In ecosystem.config.js:
max_memory_restart: '1G'

# Or in Docker Compose:
deploy:
  resources:
    limits:
      memory: 1G
```

#### 8. Service Dependencies Not Ready

**Symptoms:**
- Gateway can't connect to services
- "Connection refused" errors
- Services starting in wrong order

**Solutions:**
```bash
# Verify startup order in compose file
# Services should have depends_on with condition: service_healthy

# Check service health
docker compose ps

# Wait for dependencies
# Use health checks and depends_on in compose
```

### Debugging Commands

**Docker Compose:**
```bash
# Execute command in container
docker compose exec cms-service sh

# View environment variables
docker compose exec cms-service env

# Check network connectivity
docker compose exec cms-service ping postgres

# View container logs
docker compose logs -f --tail=100 cms-service
```

**PM2:**
```bash
# View detailed service info
pm2 show cms-service

# View environment variables
pm2 env cms-service

# Reset restart counter
pm2 reset cms-service

# Flush logs
pm2 flush
```

### Log Analysis

**Find Errors:**
```bash
# Docker Compose
docker compose logs | grep -i error

# PM2
pm2 logs --err
```

**Find Specific Service:**
```bash
# Docker Compose
docker compose logs cms-service | grep -i error

# PM2
pm2 logs cms-service --err
```

**Follow Logs:**
```bash
# Docker Compose
docker compose logs -f cms-service

# PM2
pm2 logs cms-service --follow
```

---

## Production Checklist

### Pre-Deployment

- [ ] Review and update `.env.production` with actual values
- [ ] Generate strong JWT secret: `openssl rand -base64 32`
- [ ] Set strong database passwords
- [ ] Configure production database URLs
- [ ] Set up Redis cluster (ElastiCache or similar)
- [ ] Configure Kafka cluster (MSK or similar)
- [ ] Set up object storage (S3, Spaces, etc.)
- [ ] Configure CDN (CloudFront, Cloudflare, etc.)
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up secrets management

### Deployment

- [ ] Build production images
- [ ] Tag images with version
- [ ] Push images to registry
- [ ] Deploy infrastructure (postgres, redis, kafka)
- [ ] Run database migrations
- [ ] Deploy microservices
- [ ] Deploy gateways
- [ ] Verify health checks
- [ ] Test API endpoints
- [ ] Monitor logs for errors

### Post-Deployment

- [ ] Verify all services are healthy
- [ ] Test authentication flow
- [ ] Test API endpoints
- [ ] Monitor metrics and logs
- [ ] Set up automated backups
- [ ] Configure auto-scaling
- [ ] Set up alerting rules
- [ ] Document deployment details
- [ ] Create runbook for operations

### Security

- [ ] Use strong secrets (JWT, DB passwords)
- [ ] Enable SSL/TLS for all connections
- [ ] Configure firewall rules
- [ ] Use secrets management (AWS Secrets Manager, etc.)
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Rotate secrets regularly
- [ ] Monitor for security vulnerabilities

### Monitoring

- [ ] Set up log aggregation
- [ ] Configure metrics collection
- [ ] Set up distributed tracing
- [ ] Create dashboards
- [ ] Configure alerts
- [ ] Set up uptime monitoring
- [ ] Monitor resource usage

---

## Additional Resources

- [Docker Compose Guide](./COMPOSE_GUIDE.md)
- [PM2 Usage Guide](./PM2_USAGE.md)
- [Environment Configuration](./ENV_CONFIGURATION.md)
- [Service Ports Reference](./shared/constants/service-ports.constant.ts)
- [Troubleshooting Guide](#troubleshooting)

---

## Support

For issues and questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review service logs
3. Check health endpoints
4. Consult service-specific documentation
