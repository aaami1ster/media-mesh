# PM2 Configuration and Usage

This document describes the PM2 ecosystem configuration for MediaMesh microservices.

---

## 📋 Configuration File

**File**: `ecosystem.config.js`

This file defines all 9 microservices with their:
- Port assignments
- Environment variables (development and production)
- Logging configuration
- Restart policies
- Memory limits
- Cluster mode settings (for gateways and discovery service)

---

## 🚀 Services Configured

### Gateways (Cluster Mode)

1. **discovery-gateway** (Port 8080)
   - Instances: 2 (cluster mode)
   - Public API gateway
   - High traffic handling

2. **cms-gateway** (Port 8081)
   - Instances: 1 (cluster mode, can scale)
   - Internal CMS API gateway

### Core Services

3. **auth-service** (Port 8086)
   - Authentication and authorization
   - JWT token management

4. **cms-service** (Port 8082)
   - Content management operations
   - Kafka event publishing

5. **metadata-service** (Port 8083)
   - Metadata management

6. **media-service** (Port 8084)
   - Media file handling
   - S3/MinIO integration

7. **ingest-service** (Port 8085)
   - Content ingestion
   - Kafka event publishing

8. **discovery-service** (Port 8092)
   - Instances: 2 (cluster mode)
   - High-read traffic service
   - Redis caching

9. **search-service** (Port 8091)
   - Search and indexing
   - Kafka event consumption

---

## 🔧 Usage

### Prerequisites

1. Build all services:
   ```bash
   npm run build:all
   ```

2. Ensure infrastructure is running:
   ```bash
   docker compose up -d postgres redis broker
   ```

### Start All Services

```bash
# Start all services in development mode
pm2 start ecosystem.config.js

# Start all services in production mode
pm2 start ecosystem.config.js --env production
```

### Start Individual Service

```bash
# Start specific service
pm2 start ecosystem.config.js --only discovery-gateway

# Start multiple services
pm2 start ecosystem.config.js --only discovery-gateway,cms-gateway
```

### Stop Services

```bash
# Stop all services
pm2 stop all

# Stop specific service
pm2 stop discovery-gateway

# Stop and delete from PM2
pm2 delete all
```

### Restart Services

```bash
# Restart all
pm2 restart all

# Restart specific service
pm2 restart discovery-gateway

# Reload (zero-downtime restart for cluster mode)
pm2 reload discovery-gateway
```

### Monitor Services

```bash
# View status
pm2 status

# View logs
pm2 logs

# View logs for specific service
pm2 logs discovery-gateway

# Monitor resources
pm2 monit

# View detailed info
pm2 show discovery-gateway
```

### Scaling

```bash
# Scale discovery-gateway to 4 instances
pm2 scale discovery-gateway 4

# Scale down
pm2 scale discovery-gateway 2
```

---

## 📊 Logging

All services log to `./logs/` directory:

- `{service-name}-out.log` - Standard output
- `{service-name}-error.log` - Error output

Logs include timestamps and are merged for cluster mode.

### View Logs

```bash
# All logs
pm2 logs

# Specific service
pm2 logs discovery-gateway

# Last 100 lines
pm2 logs --lines 100

# Follow logs
pm2 logs --follow
```

---

## 🔄 Restart Policies

All services are configured with:
- `autorestart: true` - Auto-restart on crash
- `max_restarts: 10` - Maximum restart attempts
- `min_uptime: "10s"` - Minimum uptime before considered stable
- `restart_delay: 4000` - Delay between restarts (4 seconds)

---

## 💾 Memory Management

Services have memory limits:
- Gateways: 500MB
- Discovery Service: 500MB
- Media Service: 500MB
- Ingest Service: 500MB
- Other services: 400MB

PM2 will restart services if they exceed these limits.

---

## 🌍 Environment Variables

### Development Mode

Uses `localhost` for all connections:
- Database: `localhost:5432`
- Redis: `localhost:6379`
- Kafka: `localhost:9092`

### Production Mode

Uses service names (for Docker Compose):
- Database: `postgres:5432`
- Redis: `redis:6379`
- Kafka: `broker:29092`

### Override Environment Variables

Create a `.env` file or export variables:

```bash
export JWT_SECRET="your-secret-key"
export DB_PASSWORD="your-password"
export REDIS_PASSWORD="your-redis-password"

pm2 start ecosystem.config.js --env production
```

---

## 📝 Save and Startup

### Save Current Process List

```bash
pm2 save
```

### Setup PM2 to Start on System Boot

```bash
# Generate startup script
pm2 startup

# Follow the instructions shown, then:
pm2 save
```

---

## 🔍 Health Checks

Each service should expose a `/health` endpoint. Monitor with:

```bash
# Check service health
curl http://localhost:8080/health  # Discovery Gateway
curl http://localhost:8081/health  # CMS Gateway
curl http://localhost:8086/health   # Auth Service
# ... etc
```

---

## 🐛 Troubleshooting

### Service Not Starting

1. Check logs:
   ```bash
   pm2 logs {service-name} --lines 50
   ```

2. Check if port is in use:
   ```bash
   lsof -i :8080
   ```

3. Verify infrastructure is running:
   ```bash
   docker compose ps
   ```

### Service Crashing

1. Check error logs:
   ```bash
   pm2 logs {service-name} --err
   ```

2. Check memory usage:
   ```bash
   pm2 monit
   ```

3. Increase memory limit in `ecosystem.config.js` if needed

### Database Connection Issues

Ensure PostgreSQL is running and accessible:
```bash
docker compose ps postgres
psql -h localhost -U postgres -d auth_db
```

### Redis Connection Issues

Test Redis connection:
```bash
docker compose exec redis redis-cli ping
```

---

## 📚 Additional PM2 Commands

```bash
# Reset restart counter
pm2 reset all

# Flush all logs
pm2 flush

# Update PM2
pm2 update

# Kill PM2 daemon
pm2 kill
```

---

## 🔐 Security Notes

- **Never commit `ecosystem.config.js`** with real secrets
- Use environment variables for sensitive data
- The file is in `.gitignore` - use `ecosystem.config.example.js` as template
- Rotate JWT secrets regularly in production

---

## 📖 References

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 Ecosystem File](https://pm2.keymetrics.io/docs/usage/application-declaration/)
