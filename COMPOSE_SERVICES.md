# Docker Compose Services Overview

This document provides a complete overview of all services in the MediaMesh Docker Compose configuration.

## Service Architecture

### Infrastructure Services (Startup Order: 1)
These services must start first and be healthy before other services can start.

1. **postgres** - PostgreSQL 16 Database
   - Port: 5432
   - Databases: auth_db, cms_db, metadata_db, media_db, discovery_db, ingest_db, search_db
   - Health Check: `pg_isready`
   - Dependencies: None

2. **redis** - Redis 7 Cache
   - Port: 6379
   - Purpose: Caching and rate limiting
   - Health Check: `redis-cli ping`
   - Dependencies: None

3. **broker** - Kafka Broker
   - Port: 9092
   - Purpose: Event streaming
   - Health Check: `kafka-broker-api-versions`
   - Dependencies: None

4. **kafka-ui** - Kafka UI Monitoring
   - Port: 8090
   - Purpose: Kafka management UI
   - Health Check: HTTP health endpoint
   - Dependencies: broker (must be healthy)

### Microservices (Startup Order: 2)
These services depend on infrastructure services.

5. **auth-service** - Authentication Service
   - Port: 8001
   - Dependencies: postgres, redis, broker
   - Purpose: User authentication and JWT management
   - Health Check: HTTP `/health`

6. **cms-service** - Content Management Service
   - Port: 8002
   - Dependencies: postgres, redis, broker
   - Purpose: Programs and episodes management
   - Health Check: HTTP `/health`

7. **metadata-service** - Metadata Service
   - Port: 8003
   - Dependencies: postgres, redis
   - Purpose: Content metadata management
   - Health Check: HTTP `/health`

8. **media-service** - Media Service
   - Port: 8004
   - Dependencies: postgres, redis
   - Purpose: Media file storage and processing
   - Health Check: HTTP `/health`

9. **ingest-service** - Ingest Service
   - Port: 8005
   - Dependencies: postgres, redis, broker
   - Purpose: Content ingestion from external sources
   - Health Check: HTTP `/health`

10. **discovery-service** - Discovery Service
    - Port: 8092
    - Dependencies: postgres, redis
    - Purpose: Content discovery and recommendations
    - Health Check: HTTP `/health`

11. **search-service** - Search Service
    - Port: 8091
    - Dependencies: postgres, broker
    - Purpose: Full-text search indexing
    - Health Check: HTTP `/health`

### API Gateways (Startup Order: 3)
These services depend on microservices being healthy.

12. **discovery-gateway** - Discovery API Gateway
    - Port: 8080
    - Dependencies: discovery-service, search-service, redis, broker
    - Purpose: Public-facing API for discovery and search
    - Health Check: HTTP `/health`

13. **cms-gateway** - CMS API Gateway
    - Port: 8081
    - Dependencies: auth-service, cms-service, metadata-service, media-service, ingest-service, redis, broker
    - Purpose: Admin/Editor API gateway with authentication
    - Health Check: HTTP `/health`

## Startup Order

```
1. Infrastructure Layer
   ├── postgres (30s start period)
   ├── redis (10s start period)
   ├── broker (60s start period)
   └── kafka-ui (depends on broker)

2. Microservices Layer
   ├── auth-service (60s start period, waits for postgres, redis, broker)
   ├── cms-service (60s start period, waits for postgres, redis, broker)
   ├── metadata-service (60s start period, waits for postgres, redis)
   ├── media-service (60s start period, waits for postgres, redis)
   ├── ingest-service (60s start period, waits for postgres, redis, broker)
   ├── discovery-service (60s start period, waits for postgres, redis)
   └── search-service (60s start period, waits for postgres, broker)

3. Gateway Layer
   ├── discovery-gateway (40s start period, waits for discovery-service, search-service)
   └── cms-gateway (40s start period, waits for all microservices)
```

## Service Dependencies Matrix

| Service | postgres | redis | broker | Other Services |
|---------|----------|-------|--------|----------------|
| auth-service | ✅ | ✅ | ✅ | - |
| cms-service | ✅ | ✅ | ✅ | - |
| metadata-service | ✅ | ✅ | ❌ | - |
| media-service | ✅ | ✅ | ❌ | - |
| ingest-service | ✅ | ✅ | ✅ | - |
| discovery-service | ✅ | ✅ | ❌ | - |
| search-service | ✅ | ❌ | ✅ | - |
| discovery-gateway | ❌ | ✅ | ✅ | discovery-service, search-service |
| cms-gateway | ❌ | ✅ | ✅ | auth, cms, metadata, media, ingest |

## Network Configuration

All services are connected to the `mediamesh-network` bridge network:
- Subnet: 172.28.0.0/16
- Driver: bridge
- Services communicate using service names as hostnames

## Health Checks

All services include health checks with the following configuration:
- **Interval**: 30s (10s for infrastructure)
- **Timeout**: 10s (3-5s for infrastructure)
- **Retries**: 3-5
- **Start Period**: 30-60s (allows services to initialize)

## Environment Variables

### Common Variables
- `NODE_ENV`: `development` (dev) or `production` (prod)
- `PORT`: Service port number
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`: Redis hostname
- `REDIS_PORT`: Redis port

### Service-Specific Variables

#### Auth Service
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRATION`: Token expiration in milliseconds

#### CMS Service
- `KAFKA_TOPIC_CONTENT_CREATED`: Kafka topic name
- `KAFKA_TOPIC_CONTENT_UPDATED`: Kafka topic name
- `KAFKA_TOPIC_CONTENT_PUBLISHED`: Kafka topic name

#### Media Service
- `S3_ENDPOINT`: Object storage endpoint
- `S3_ACCESS_KEY`: Object storage access key
- `S3_SECRET_KEY`: Object storage secret key
- `S3_BUCKET`: Object storage bucket name
- `S3_REGION`: Object storage region

#### Ingest Service
- `KAFKA_TOPIC_INGEST_COMPLETED`: Kafka topic name
- `KAFKA_TOPIC_INGEST_FAILED`: Kafka topic name

#### Discovery Service
- `REDIS_TTL_PROGRAMS`: Cache TTL for programs (seconds)
- `REDIS_TTL_SEARCH`: Cache TTL for search (seconds)
- `REDIS_TTL_TRENDING`: Cache TTL for trending (seconds)

#### Search Service
- `KAFKA_TOPIC_CONTENT_EVENTS`: Kafka topic name
- `KAFKA_TOPIC_INGEST_EVENTS`: Kafka topic name
- `KAFKA_GROUP_ID`: Kafka consumer group ID

#### Discovery Gateway
- `DISCOVERY_SERVICE_URL`: Discovery service URL
- `SEARCH_SERVICE_URL`: Search service URL
- `RATE_LIMIT_DEFAULT_TTL`: Rate limit window (seconds)
- `RATE_LIMIT_DEFAULT_LIMIT`: Rate limit max requests
- `RATE_LIMIT_SEARCH_LIMIT`: Search endpoint rate limit

#### CMS Gateway
- `CMS_SERVICE_URL`: CMS service URL
- `METADATA_SERVICE_URL`: Metadata service URL
- `MEDIA_SERVICE_URL`: Media service URL
- `INGEST_SERVICE_URL`: Ingest service URL
- `AUTH_SERVICE_URL`: Auth service URL
- `RATE_LIMIT_ADMIN_LIMIT`: Admin user rate limit
- `RATE_LIMIT_EDITOR_LIMIT`: Editor user rate limit

## Port Mapping

| Service | Container Port | Host Port | Protocol |
|---------|---------------|-----------|----------|
| postgres | 5432 | 5432 | TCP |
| redis | 6379 | 6379 | TCP |
| broker | 9092 | 9092 | TCP |
| kafka-ui | 8080 | 8090 | HTTP |
| auth-service | 8001 | 8001 | HTTP |
| cms-service | 8002 | 8002 | HTTP |
| metadata-service | 8003 | 8003 | HTTP |
| media-service | 8004 | 8004 | HTTP |
| ingest-service | 8005 | 8005 | HTTP |
| discovery-service | 8092 | 8092 | HTTP |
| search-service | 8091 | 8091 | HTTP |
| discovery-gateway | 8080 | 8080 | HTTP |
| cms-gateway | 8081 | 8081 | HTTP |

## Volumes

- `postgres_data`: PostgreSQL data persistence
- `redis_data`: Redis data persistence
- `kafka_data`: Kafka data persistence

## Restart Policies

All services use `restart: unless-stopped` to ensure:
- Services restart automatically on failure
- Services don't restart if manually stopped
- Services start on Docker daemon restart

## Monitoring

### Health Check Endpoints
All services expose `/health` endpoint for monitoring:
- Infrastructure: Built-in health checks
- Microservices: HTTP GET `/health`
- Gateways: HTTP GET `/health`

### Logs
View logs for any service:
```bash
docker compose logs -f <service-name>
```

### Status
Check service status:
```bash
docker compose ps
```

## Troubleshooting

### Service Won't Start
1. Check dependencies are healthy: `docker compose ps`
2. Check service logs: `docker compose logs <service-name>`
3. Verify environment variables are set correctly
4. Ensure ports are not already in use

### Health Check Failing
1. Verify service is listening on correct port
2. Check service logs for errors
3. Increase `start_period` if service needs more time
4. Verify `/health` endpoint is implemented

### Network Issues
1. Verify all services are on `mediamesh-network`
2. Test connectivity: `docker compose exec <service> ping <other-service>`
3. Check DNS resolution: `docker compose exec <service> nslookup <other-service>`
