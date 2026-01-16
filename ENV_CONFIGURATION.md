# Environment Configuration Guide

This guide explains how to configure environment variables for MediaMesh services.

## Files

- **`.env.example`** - Template with all variables and descriptions
- **`.env.development`** - Development configuration (safe defaults)
- **`.env.production`** - Production template (requires secrets)

## Quick Start

### Development

1. Copy the development template:
   ```bash
   cp .env.development .env
   ```

2. Start services:
   ```bash
   docker compose -f compose.dev.yml up
   ```

### Production

1. Copy the production template:
   ```bash
   cp .env.production .env
   ```

2. **CRITICAL**: Replace all `CHANGE_THIS_*` placeholders with actual values

3. Use secrets management (recommended):
   - AWS Secrets Manager
   - Kubernetes Secrets
   - Docker Secrets
   - HashiCorp Vault

## Environment Variables by Category

### 1. Application Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |

### 2. Database Configuration

#### PostgreSQL Connection

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | `localhost` | Yes |
| `DB_PORT` | Database port | `5432` | Yes |
| `DB_USERNAME` | Database username | `postgres` | Yes |
| `DB_PASSWORD` | Database password | `postgres` | Yes |

#### Service-Specific Database URLs

Each service can use either:
- Individual `DB_*` variables, OR
- A complete `DATABASE_URL`

**Format:**
```
postgresql://username:password@host:port/database?schema=public
```

**Service Variables:**
- `AUTH_DATABASE_URL` / `AUTH_DB_NAME`
- `CMS_DATABASE_URL` / `CMS_DB_NAME`
- `METADATA_DATABASE_URL` / `METADATA_DB_NAME`
- `MEDIA_DATABASE_URL` / `MEDIA_DB_NAME`
- `INGEST_DATABASE_URL` / `INGEST_DB_NAME`
- `DISCOVERY_DATABASE_URL` / `DISCOVERY_DB_NAME`
- `SEARCH_DATABASE_URL` / `SEARCH_DB_NAME`

### 3. Redis Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_HOST` | Redis host | `localhost` | Yes |
| `REDIS_PORT` | Redis port | `6379` | Yes |
| `REDIS_PASSWORD` | Redis password | (empty) | No |
| `REDIS_DB` | Redis database number | `0` | No |

**Cache TTL Configuration:**
- `REDIS_TTL_PROGRAMS` - Programs cache TTL (seconds)
- `REDIS_TTL_SEARCH` - Search results cache TTL (seconds)
- `REDIS_TTL_TRENDING` - Trending content cache TTL (seconds)
- `REDIS_TTL_POPULAR` - Popular content cache TTL (seconds)
- `REDIS_TTL_EPISODES` - Episodes cache TTL (seconds)

### 4. Kafka Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `KAFKA_BROKER` | Kafka broker address | `localhost:9092` | Yes |
| `KAFKA_CLIENT_ID_*` | Client ID per service | (service name) | Yes |
| `KAFKA_GROUP_ID_*` | Consumer group ID | (service-group) | Yes |

**Kafka Topics:**
- `KAFKA_TOPIC_CONTENT_CREATED` - Content creation events
- `KAFKA_TOPIC_CONTENT_UPDATED` - Content update events
- `KAFKA_TOPIC_CONTENT_PUBLISHED` - Content publication events
- `KAFKA_TOPIC_CONTENT_EVENTS` - General content events
- `KAFKA_TOPIC_INGEST_COMPLETED` - Ingest completion events
- `KAFKA_TOPIC_INGEST_FAILED` - Ingest failure events
- `KAFKA_TOPIC_INGEST_EVENTS` - General ingest events

### 5. JWT Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing secret | (none) | **Yes** |
| `JWT_EXPIRATION` | Token expiration (ms) | `86400000` | No |
| `JWT_EXPIRATION_STRING` | Token expiration (string) | `24h` | No |

**⚠️ Security Warning:**
- Generate a strong random secret: `openssl rand -base64 32`
- Never use default secrets in production
- Rotate secrets regularly

### 6. Object Storage Configuration

#### Storage Provider

| Variable | Description | Options | Default |
|----------|-------------|---------|---------|
| `STORAGE_PROVIDER` | Storage provider | `S3`, `SPACES`, `MINIO` | `MINIO` |

#### AWS S3 / DigitalOcean Spaces

| Variable | Description | Required |
|----------|-------------|----------|
| `STORAGE_ENDPOINT` | S3 endpoint URL | Yes |
| `STORAGE_REGION` | AWS region | Yes |
| `STORAGE_BUCKET` | Bucket name | Yes |
| `STORAGE_ACCESS_KEY_ID` | Access key | Yes |
| `STORAGE_SECRET_ACCESS_KEY` | Secret key | Yes |
| `CDN_BASE_URL` | CDN URL (optional) | No |

#### MinIO (Local Development)

| Variable | Description | Default |
|----------|-------------|---------|
| `MINIO_ENDPOINT` | MinIO endpoint | `localhost:9000` |
| `MINIO_USE_SSL` | Use SSL | `false` |

**Legacy Variables (for compatibility):**
- `S3_ENDPOINT`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_BUCKET`
- `S3_REGION`

### 7. Service URLs

Internal service URLs for inter-service communication:

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | Auth service URL | `http://auth-service:8001` |
| `CMS_SERVICE_URL` | CMS service URL | `http://cms-service:8002` |
| `METADATA_SERVICE_URL` | Metadata service URL | `http://metadata-service:8003` |
| `MEDIA_SERVICE_URL` | Media service URL | `http://media-service:8004` |
| `INGEST_SERVICE_URL` | Ingest service URL | `http://ingest-service:8005` |
| `DISCOVERY_SERVICE_URL` | Discovery service URL | `http://discovery-service:8092` |
| `SEARCH_SERVICE_URL` | Search service URL | `http://search-service:8091` |

**Note:** In Docker Compose, use service names. In Kubernetes, use service names or DNS.

### 8. Rate Limiting Configuration

#### CMS Gateway

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_DEFAULT_TTL` | Default window (seconds) | `60` |
| `RATE_LIMIT_DEFAULT_LIMIT` | Default requests per window | `100` |
| `RATE_LIMIT_ADMIN_LIMIT` | Admin requests per window | `100` |
| `RATE_LIMIT_EDITOR_LIMIT` | Editor requests per window | `50` |

#### Discovery Gateway

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_SEARCH_LIMIT` | Search requests per minute | `60` |
| `RATE_LIMIT_AUTHENTICATED_LIMIT` | Authenticated requests | `200` |

### 9. Resilience Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `RETRY_MAX_ATTEMPTS` | Max retry attempts | `3` |
| `RETRY_INITIAL_DELAY` | Initial retry delay (ms) | `1000` |
| `RETRY_MAX_DELAY` | Max retry delay (ms) | `10000` |
| `RETRY_MULTIPLIER` | Retry delay multiplier | `2` |
| `CIRCUIT_BREAKER_FAILURE_THRESHOLD` | Failures before open | `5` |
| `CIRCUIT_BREAKER_SUCCESS_THRESHOLD` | Successes to close | `2` |
| `CIRCUIT_BREAKER_TIMEOUT` | Circuit timeout (ms) | `60000` |
| `REQUEST_TIMEOUT` | Request timeout (ms) | `30000` |

### 10. Service-Specific Configuration

#### Auth Service

| Variable | Description | Default |
|----------|-------------|---------|
| `BCRYPT_SALT_ROUNDS` | Bcrypt salt rounds | `10` |
| `ADMIN_EMAIL` | Admin user email | `admin@mediamesh.com` |
| `ADMIN_PASSWORD` | Admin user password | `Admin123!@#` |

#### Ingest Service

| Variable | Description | Default |
|----------|-------------|---------|
| `YOUTUBE_API_KEY` | YouTube API key | (empty) |
| `MAX_RETRIES` | Max retry attempts | `3` |
| `INGEST_BATCH_SIZE` | Batch size for ingestion | `10` |

#### Search Service

| Variable | Description | Default |
|----------|-------------|---------|
| `SEARCH_MAX_RESULTS` | Max search results | `100` |
| `SEARCH_DEFAULT_LIMIT` | Default results limit | `20` |

#### GraphQL (Discovery Gateway)

| Variable | Description | Default |
|----------|-------------|---------|
| `GRAPHQL_PLAYGROUND` | Enable playground | `true` |
| `GRAPHQL_INTROSPECTION` | Enable introspection | `true` |

## Environment-Specific Configuration

### Development

**File:** `.env.development`

- Safe defaults for local development
- Uses Docker Compose service names
- MinIO for object storage
- Debug logging enabled
- GraphQL playground enabled

**Usage:**
```bash
cp .env.development .env
docker compose -f compose.dev.yml up
```

### Production

**File:** `.env.production`

- Placeholder values that MUST be replaced
- Production database URLs
- AWS S3 or production object storage
- Strong secrets required
- GraphQL playground disabled
- Info-level logging

**Usage:**
```bash
cp .env.production .env
# Edit .env and replace all CHANGE_THIS_* values
docker compose -f compose.prod.yml up
```

## Secrets Management

### Best Practices

1. **Never commit secrets** to version control
2. **Use secrets management tools:**
   - AWS Secrets Manager
   - Kubernetes Secrets
   - Docker Secrets
   - HashiCorp Vault
   - Environment variables in CI/CD

3. **Rotate secrets regularly:**
   - JWT secrets: Every 90 days
   - Database passwords: Every 180 days
   - API keys: As needed

4. **Use different secrets per environment:**
   - Development
   - Staging
   - Production

### Generating Secrets

**JWT Secret:**
```bash
openssl rand -base64 32
# or
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Database Password:**
```bash
openssl rand -base64 24
```

## Docker Compose Integration

### Using .env file

Docker Compose automatically loads `.env` file from the project root:

```bash
# .env file is automatically loaded
docker compose up
```

### Overriding variables

```bash
# Override specific variables
JWT_SECRET=my-secret docker compose up

# Use different env file
docker compose --env-file .env.production up
```

## Kubernetes Integration

### ConfigMap

Create ConfigMap from .env file:
```bash
kubectl create configmap mediamesh-config --from-env-file=.env.production
```

### Secrets

Create Secrets for sensitive data:
```bash
kubectl create secret generic mediamesh-secrets \
  --from-literal=jwt-secret='your-secret' \
  --from-literal=db-password='your-password'
```

## Validation

### Check environment variables

```bash
# Load and print all variables
node -e "require('dotenv').config(); console.log(process.env)"
```

### Validate required variables

```bash
# Check if required variables are set
node scripts/validate-env.js
```

## Troubleshooting

### Variable not found

**Error:** `Environment variable not found: DATABASE_URL`

**Solution:**
1. Ensure `.env` file exists in project root
2. Check variable name spelling
3. Verify no extra spaces in `.env` file
4. Restart services after changing `.env`

### Wrong values

**Error:** Connection refused or authentication failed

**Solution:**
1. Verify database credentials
2. Check service URLs (use service names in Docker)
3. Verify network connectivity
4. Check logs: `docker compose logs <service>`

### Secrets in logs

**Warning:** Secrets may appear in logs

**Solution:**
1. Use secrets management tools
2. Mask secrets in logging
3. Use environment variables, not files
4. Enable log sanitization

## Related Documentation

- [Docker Compose Guide](./COMPOSE_GUIDE.md)
- [Service Configuration](./COMPOSE_SERVICES.md)
- [Security Notes](./SECURITY_NOTES.md)
