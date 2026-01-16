# Health Check Endpoints

All MediaMesh services expose health check endpoints for monitoring and orchestration.

## Overview

Health checks are used by:
- Docker Compose for service dependencies
- Kubernetes for liveness/readiness probes
- Load balancers for traffic routing
- Monitoring systems for alerting

## Endpoint Format

All services expose: `GET /health`

**Response Format:**
```json
{
  "status": "ok" | "error",
  "timestamp": "2024-01-16T12:00:00.000Z",
  "service": "service-name",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "ok" | "error",
    "redis": "ok" | "error" | "not_configured",
    "kafka": "ok" | "error" | "not_configured"
  }
}
```

## Service Health Endpoints

### API Gateways

#### Discovery Gateway
- **URL**: `http://localhost:8080/health`
- **Port**: 8080
- **Checks**: Redis, Kafka, Downstream services

#### CMS Gateway
- **URL**: `http://localhost:8081/health`
- **Port**: 8081
- **Checks**: Redis, Kafka, Downstream services

### Core Services

#### Auth Service
- **URL**: `http://localhost:8001/health`
- **Port**: 8001
- **Checks**: Database, Redis, Kafka

#### CMS Service
- **URL**: `http://localhost:8002/health`
- **Port**: 8002
- **Checks**: Database, Redis, Kafka

#### Metadata Service
- **URL**: `http://localhost:8003/health`
- **Port**: 8003
- **Checks**: Database, Redis

#### Media Service
- **URL**: `http://localhost:8004/health`
- **Port**: 8004
- **Checks**: Database, Redis, Object Storage

#### Ingest Service
- **URL**: `http://localhost:8005/health`
- **Port**: 8005
- **Checks**: Database, Redis, Kafka

#### Discovery Service
- **URL**: `http://localhost:8092/health`
- **Port**: 8092
- **Checks**: Database, Redis

#### Search Service
- **URL**: `http://localhost:8091/health`
- **Port**: 8091
- **Checks**: Database, Kafka

## Health Check Status Codes

- **200 OK**: Service is healthy
- **503 Service Unavailable**: Service is unhealthy (dependency failure)
- **500 Internal Server Error**: Service error

## Testing Health Checks

### Using curl

```bash
# Test all services
for port in 8080 8081 8001 8002 8003 8004 8005 8091 8092; do
  echo "Testing port $port..."
  curl -f http://localhost:$port/health && echo " ✓" || echo " ✗"
done
```

### Using Docker Compose

```bash
# Check service health status
docker compose ps

# Test health endpoint
docker compose exec discovery-gateway curl http://localhost:8080/health
```

### Using PM2

```bash
# Check process status
pm2 status

# Test health endpoint
curl http://localhost:8080/health
```

## Health Check Script

Create `scripts/health-check.sh`:

```bash
#!/bin/bash

SERVICES=(
  "8080:discovery-gateway"
  "8081:cms-gateway"
  "8001:auth-service"
  "8002:cms-service"
  "8003:metadata-service"
  "8004:media-service"
  "8005:ingest-service"
  "8091:search-service"
  "8092:discovery-service"
)

echo "Health Check Report"
echo "==================="
echo ""

for service in "${SERVICES[@]}"; do
  IFS=':' read -r port name <<< "$service"
  if curl -f -s http://localhost:$port/health > /dev/null 2>&1; then
    echo "✓ $name (port $port) - Healthy"
  else
    echo "✗ $name (port $port) - Unhealthy"
  fi
done
```

Make executable:
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

## Docker Compose Health Checks

Health checks are configured in `compose.dev.yml` and `compose.prod.yml`:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8002/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

## Kubernetes Health Checks

Example liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8002
  initialDelaySeconds: 60
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 8002
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

## Monitoring Integration

### Prometheus

Health checks can be exposed as metrics:

```typescript
// Example metric
health_check_status{service="cms-service",status="ok"} 1
```

### Grafana Dashboard

Create dashboard with health check status for all services.

### Alerting

Set up alerts for:
- Health check failures
- Dependency failures (database, redis, kafka)
- Service downtime

## Troubleshooting Health Checks

### Health Check Failing

1. **Check service logs:**
   ```bash
   docker compose logs cms-service
   ```

2. **Test endpoint manually:**
   ```bash
   curl -v http://localhost:8002/health
   ```

3. **Verify service is running:**
   ```bash
   docker compose ps
   ```

4. **Check dependencies:**
   - Database connection
   - Redis connection
   - Kafka connection

### Slow Health Checks

1. **Increase timeout:**
   ```yaml
   healthcheck:
     timeout: 30s
   ```

2. **Increase start period:**
   ```yaml
   healthcheck:
     start_period: 120s
   ```

3. **Optimize health check logic:**
   - Cache dependency checks
   - Use lightweight checks
   - Avoid expensive operations
