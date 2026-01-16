# DynamoDB Integration Setup

Quick setup guide for DynamoDB integration in Discovery and Search services.

## Installation

The AWS SDK packages are already added to `shared/package.json`. Install dependencies:

```bash
# From project root
npm install

# Or install in shared module
cd shared
npm install
```

## Quick Start

### 1. Start DynamoDB Local

```bash
# Option 1: Standalone
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local

# Option 2: With Docker Compose
docker compose -f docker-compose.dynamodb.yml up -d

# Option 3: Include in main compose
docker compose -f compose.dev.yml up -d dynamodb-local
```

### 2. Configure Environment

Add to `.env.development` or service environment:

```env
# DynamoDB Configuration
DYNAMODB_ENABLED=true
DYNAMODB_ENDPOINT=http://localhost:8000  # For local
# OR remove endpoint for AWS DynamoDB
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local  # For DynamoDB Local
AWS_SECRET_ACCESS_KEY=local  # For DynamoDB Local

# Discovery Service
DYNAMODB_TABLE_TRENDING=mediamesh-trending
DYNAMODB_TABLE_POPULAR=mediamesh-popular

# Search Service
DYNAMODB_TABLE_SEARCH_INDEX=mediamesh-search-index
DYNAMODB_TTL_SECONDS=2592000  # 30 days

# Common
DYNAMODB_TTL_ATTRIBUTE=ttl
```

### 3. Start Services

```bash
# Services will automatically create tables on startup
docker compose -f compose.dev.yml up -d discovery-service search-service
```

## Testing

### Verify Tables Created

```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Expected output:
# {
#   "TableNames": [
#     "mediamesh-trending",
#     "mediamesh-popular",
#     "mediamesh-search-index"
#   ]
# }
```

### Test Trending Endpoint

```bash
# This will query DynamoDB first, then fallback to PostgreSQL
curl http://localhost:8092/discovery/trending?limit=10
```

### Test Search Endpoint

```bash
# This will try DynamoDB for simple queries
curl "http://localhost:8091/search?q=test"
```

## Architecture

### Cache-Aside Pattern

```
┌─────────┐
│ Request │
└────┬────┘
     │
     ▼
┌─────────────┐
│  DynamoDB   │ ← Hot data (trending, popular, indexes)
│  (Primary)  │
└──────┬──────┘
       │ Miss
       ▼
┌─────────────┐
│   Redis     │ ← Cache layer
│   (Cache)   │
└──────┬──────┘
       │ Miss
       ▼
┌─────────────┐
│ PostgreSQL  │ ← Source of truth
│  (Fallback) │
└─────────────┘
```

## Tables

### Discovery Service

- **mediamesh-trending**: Trending content (TTL: 10 min)
- **mediamesh-popular**: Popular content (TTL: 5 min)

### Search Service

- **mediamesh-search-index**: Search indexes (TTL: 30 days)

## Production Setup

### AWS DynamoDB

1. Create tables in AWS Console or via CloudFormation
2. Configure IAM roles (see DYNAMODB_INTEGRATION.md)
3. Update environment variables:
   ```env
   DYNAMODB_ENABLED=true
   # Remove DYNAMODB_ENDPOINT
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=<from-secrets-manager>
   AWS_SECRET_ACCESS_KEY=<from-secrets-manager>
   ```

### IAM Roles

See [DYNAMODB_INTEGRATION.md](./docs/DYNAMODB_INTEGRATION.md) for IAM policy examples.

## Troubleshooting

### Tables Not Created

- Check `DYNAMODB_ENABLED=true`
- Verify DynamoDB Local is running
- Check service logs for errors

### Connection Errors

- Verify `DYNAMODB_ENDPOINT` is correct
- For AWS: Check IAM permissions
- Test connection: `curl http://localhost:8000`

### TTL Not Working

- Verify `DYNAMODB_TTL_ATTRIBUTE=ttl`
- Check TTL values are Unix timestamps (seconds)
- Ensure TTL is enabled on table

## Related Documentation

- [DynamoDB Integration Guide](./docs/DYNAMODB_INTEGRATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
