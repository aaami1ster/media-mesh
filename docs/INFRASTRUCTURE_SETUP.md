# MediaMesh Infrastructure Setup

This document describes the Docker Compose infrastructure setup for MediaMesh.

---

## 🏗️ Infrastructure Components

### 1. PostgreSQL 16 (Single Instance, Multiple Databases)

**Container**: `mediamesh-postgres`  
**Image**: `postgres:16-alpine`  
**Port**: `5432`  
**Databases**: 
- `auth_db` - Authentication service
- `cms_db` - CMS service
- `metadata_db` - Metadata service
- `media_db` - Media service
- `discovery_db` - Discovery service
- `ingest_db` - Ingest service
- `search_db` - Search service

**Configuration**:
- Uses "Database per Service" pattern (single PostgreSQL instance, separate databases)
- Initialization script: `docker/init-multiple-databases.sh`
- Data persistence: `postgres_data` volume
- Health check: `pg_isready`

**Environment Variables**:
```yaml
POSTGRES_DB: postgres
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres
```

**Connection String Format**:
```
postgresql://postgres:postgres@postgres:5432/{database_name}
```

---

### 2. Redis 7 (Caching & Rate Limiting)

**Container**: `mediamesh-redis`  
**Image**: `redis:7-alpine`  
**Port**: `6379`

**Configuration**:
- AOF (Append Only File) persistence enabled
- Max memory: 512MB
- Eviction policy: `allkeys-lru`
- Data persistence: `redis_data` volume
- Health check: `redis-cli ping`

**Usage**:
- Hot-read caching for discovery service
- Rate limiting storage
- Session storage (if needed)

**Environment Variables**:
```yaml
REDIS_PASSWORD: ${REDIS_PASSWORD:-}  # Optional password
```

---

### 3. Kafka (Event Streaming)

**Container**: `mediamesh-kafka`  
**Image**: `confluentinc/cp-kafka:7.6.0`  
**Port**: `9092` (external), `29092` (internal)

**Configuration**:
- KRaft mode (no Zookeeper needed)
- Single broker setup (development)
- Data persistence: `kafka_data` volume
- Health check: `kafka-broker-api-versions`

**Topics** (created automatically):
- `content.created`
- `content.updated`
- `content.published`
- `ingest.completed`
- `ingest.failed`
- `content.events`
- `ingest.events`

**Connection**:
- Internal: `broker:29092`
- External: `localhost:9092`

---

### 4. Kafka UI (Monitoring)

**Container**: `mediamesh-kafka-ui`  
**Image**: `provectuslabs/kafka-ui:latest`  
**Port**: `8090` (host) → `8080` (container)

**Configuration**:
- Web UI for Kafka cluster monitoring
- Topic browsing and message inspection
- Consumer group monitoring
- Authentication: Login form (default: admin/admin)

**Access**:
- URL: http://localhost:8090
- Username: `admin` (or `KAFKA_UI_USER`)
- Password: `admin` (or `KAFKA_UI_PASSWORD`)

**Environment Variables**:
```yaml
KAFKA_UI_USER: ${KAFKA_UI_USER:-admin}
KAFKA_UI_PASSWORD: ${KAFKA_UI_PASSWORD:-admin}
```

---

## 🔗 Network Configuration

**Network**: `mediamesh-network`  
**Type**: Bridge  
**Subnet**: `172.28.0.0/16`

All services communicate through this network using service names as hostnames.

**Example**:
- `postgres:5432` - PostgreSQL connection
- `redis:6379` - Redis connection
- `broker:29092` - Kafka connection
- `discovery-service:8092` - Discovery service

---

## 📊 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database server |
| Redis | 6379 | Cache & rate limiting |
| Kafka | 9092 | Event streaming (external) |
| Kafka UI | 8090 | Kafka monitoring |
| Discovery Gateway | 8080 | Public API gateway |
| CMS Gateway | 8081 | CMS API gateway |
| CMS Service | 8082 | CMS microservice |
| Metadata Service | 8083 | Metadata microservice |
| Media Service | 8084 | Media microservice |
| Ingest Service | 8085 | Ingest microservice |
| Auth Service | 8086 | Authentication service |
| Discovery Service | 8092 | Discovery microservice |
| Search Service | 8091 | Search microservice |

---

## 🚀 Usage

### Start Infrastructure Only
```bash
docker compose up postgres redis broker kafka-ui
```

### Start All Services
```bash
docker compose up
```

### Start in Background
```bash
docker compose up -d
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f broker
docker compose logs -f kafka-ui
```

### Stop Services
```bash
docker compose down
```

### Stop and Remove Volumes
```bash
docker compose down -v
```

---

## 🔍 Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready -U postgres -d postgres`
- **Redis**: `redis-cli ping`
- **Kafka**: `kafka-broker-api-versions --bootstrap-server localhost:9092`
- **Kafka UI**: HTTP health endpoint

Check service health:
```bash
docker compose ps
```

---

## 💾 Data Persistence

All data is persisted in Docker volumes:

- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data
- `kafka_data` - Kafka logs

Volumes persist across container restarts. To reset:
```bash
docker compose down -v
docker compose up -d
```

---

## 🔐 Security Notes

**Development Only**: This setup uses default credentials for development.

**Production**:
- Use environment variables for all secrets
- Enable Redis password authentication
- Use Kafka SASL/SSL
- Use PostgreSQL SSL connections
- Change Kafka UI credentials

**Environment Variables**:
Create a `.env` file:
```env
POSTGRES_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-jwt-secret-key
KAFKA_UI_USER=admin
KAFKA_UI_PASSWORD=secure-password
```

---

## 🐛 Troubleshooting

### PostgreSQL not starting
```bash
docker compose logs postgres
# Check if init script has correct permissions
chmod +x docker/init-multiple-databases.sh
```

### Redis connection issues
```bash
docker compose exec redis redis-cli ping
```

### Kafka not accessible
```bash
docker compose logs broker
# Check if broker is healthy
docker compose ps broker
```

### Port conflicts
Check if ports are already in use:
```bash
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9092  # Kafka
lsof -i :8090  # Kafka UI
```

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
- [Redis Documentation](https://redis.io/docs/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Kafka UI Documentation](https://docs.kafka-ui.provectus.io/)
