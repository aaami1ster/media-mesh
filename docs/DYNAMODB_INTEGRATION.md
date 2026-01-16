# DynamoDB Integration Guide

This guide explains how DynamoDB is integrated into Discovery and Search services for high-performance hot data storage.

## Overview

DynamoDB is used for:
- **Discovery Service**: Hot data (trending, popular content) with automatic TTL
- **Search Service**: Search indexes with automatic expiration

## Architecture

### Cache-Aside Pattern

Both services implement a **cache-aside pattern** with fallback:

```
Request → DynamoDB (hot data) → Redis (cache) → PostgreSQL (source of truth)
```

**Flow:**
1. Check DynamoDB first (fastest, hot data)
2. If miss, check Redis cache
3. If miss, query PostgreSQL
4. Write back to DynamoDB and Redis

### TTL (Time To Live)

DynamoDB items have automatic TTL:
- **Trending**: 10 minutes (600 seconds)
- **Popular**: 5 minutes (300 seconds)
- **Search Index**: 30 days (2,592,000 seconds)

Items are automatically deleted by DynamoDB when TTL expires.

## Configuration

### Environment Variables

**Discovery Service:**
```env
DYNAMODB_ENABLED=true
DYNAMODB_ENDPOINT=http://dynamodb-local:8000  # For local dev
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local  # For DynamoDB Local
AWS_SECRET_ACCESS_KEY=local  # For DynamoDB Local
DYNAMODB_TABLE_TRENDING=mediamesh-trending
DYNAMODB_TABLE_POPULAR=mediamesh-popular
DYNAMODB_TTL_ATTRIBUTE=ttl
```

**Search Service:**
```env
DYNAMODB_ENABLED=true
DYNAMODB_ENDPOINT=http://dynamodb-local:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
DYNAMODB_TABLE_SEARCH_INDEX=mediamesh-search-index
DYNAMODB_TTL_ATTRIBUTE=ttl
DYNAMODB_TTL_SECONDS=2592000  # 30 days
```

### DynamoDB Local (Development)

For local development, use DynamoDB Local:

```bash
# Start DynamoDB Local
docker compose -f docker-compose.dynamodb.yml up -d

# Or include in main compose
docker compose -f compose.dev.yml up -d dynamodb-local
```

**Endpoint:** `http://localhost:8000`

### AWS DynamoDB (Production)

For production, use AWS DynamoDB:

```env
DYNAMODB_ENABLED=true
# Remove DYNAMODB_ENDPOINT (uses AWS)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
```

## Tables

### Discovery Service Tables

#### `mediamesh-trending`
- **Partition Key**: `contentType` (PROGRAM, EPISODE, all)
- **Sort Key**: `rank` (1, 2, 3, ...)
- **TTL**: `ttl` attribute (10 minutes)
- **GSI**: None

**Item Structure:**
```json
{
  "contentType": "PROGRAM",
  "rank": 1,
  "programId": "uuid",
  "title": "Program Title",
  "description": "Description",
  "data": "{...full object...}",
  "ttl": 1234567890
}
```

#### `mediamesh-popular`
- **Partition Key**: `contentType`
- **Sort Key**: `rank`
- **TTL**: `ttl` attribute (5 minutes)
- **GSI**: None

### Search Service Tables

#### `mediamesh-search-index`
- **Partition Key**: `contentId` (unique)
- **Sort Key**: None
- **TTL**: `ttl` attribute (30 days)
- **GSI**: 
  - `contentType-index` (partition key: contentType)
  - `category-index` (partition key: category)

**Item Structure:**
```json
{
  "contentId": "uuid",
  "contentType": "PROGRAM",
  "title": "Title",
  "description": "Description",
  "category": "category",
  "language": "en",
  "tags": ["tag1", "tag2"],
  "indexedAt": "2024-01-16T12:00:00Z",
  "updatedAt": "2024-01-16T12:00:00Z",
  "ttl": 1234567890
}
```

## Implementation Details

### Discovery Service

**Trending/Popular Flow:**
1. Check DynamoDB for cached results
2. If found, return immediately
3. If not found, query PostgreSQL
4. Store in DynamoDB with TTL
5. Also store in Redis cache

**Code:**
```typescript
// Try DynamoDB first
const dynamoResult = await this.dynamoDBRepository.getTrending(contentType, limit);
if (dynamoResult) {
  return dynamoResult;
}

// Fallback to PostgreSQL
const trending = await this.repository.findTrending(contentType, limit);

// Store in DynamoDB
await this.dynamoDBRepository.storeTrending(contentType, trending, ttl);
```

### Search Service

**Indexing Flow:**
1. Write to DynamoDB (primary)
2. Write to PostgreSQL (fallback)
3. If DynamoDB fails, PostgreSQL is used

**Search Flow:**
1. Try DynamoDB for simple queries
2. Fallback to PostgreSQL for complex full-text search
3. DynamoDB is limited - use OpenSearch/Elasticsearch for production

**Code:**
```typescript
// Try DynamoDB first
if (DYNAMODB_CONFIG.ENABLED && query.length < 50) {
  const dynamoResult = await this.dynamoDBRepository.search(...);
  if (dynamoResult.results.length > 0) {
    return dynamoResult;
  }
}

// Fallback to PostgreSQL
return await this.repository.search(...);
```

## IAM Roles (Production)

### Discovery Service IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:DeleteItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:ACCOUNT:table/mediamesh-trending",
        "arn:aws:dynamodb:us-east-1:ACCOUNT:table/mediamesh-trending/index/*",
        "arn:aws:dynamodb:us-east-1:ACCOUNT:table/mediamesh-popular",
        "arn:aws:dynamodb:us-east-1:ACCOUNT:table/mediamesh-popular/index/*"
      ]
    }
  ]
}
```

### Search Service IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DeleteItem",
        "dynamodb:UpdateItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:ACCOUNT:table/mediamesh-search-index",
        "arn:aws:dynamodb:us-east-1:ACCOUNT:table/mediamesh-search-index/index/*"
      ]
    }
  ]
}
```

## Testing with DynamoDB Local

### Start DynamoDB Local

```bash
# Using Docker Compose
docker compose -f docker-compose.dynamodb.yml up -d

# Or standalone
docker run -p 8000:8000 amazon/dynamodb-local
```

### Verify Tables

```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Describe table
aws dynamodb describe-table \
  --table-name mediamesh-trending \
  --endpoint-url http://localhost:8000
```

### Test Queries

```bash
# Query trending
aws dynamodb query \
  --table-name mediamesh-trending \
  --key-condition-expression "contentType = :ct" \
  --expression-attribute-values '{":ct":{"S":"PROGRAM"}}' \
  --endpoint-url http://localhost:8000

# Get item
aws dynamodb get-item \
  --table-name mediamesh-search-index \
  --key '{"contentId":{"S":"uuid"}}' \
  --endpoint-url http://localhost:8000
```

## Performance Considerations

### DynamoDB Benefits

- **Low Latency**: Single-digit millisecond reads
- **Automatic Scaling**: Handles traffic spikes
- **TTL**: Automatic cleanup of expired items
- **NoSQL**: Flexible schema for hot data

### Limitations

- **No Full-Text Search**: DynamoDB doesn't support full-text search natively
- **Query Limitations**: Limited query patterns (partition key required)
- **Cost**: On-demand pricing can be expensive at scale

### Best Practices

1. **Use DynamoDB for Hot Data**: Trending, popular, frequently accessed
2. **Use PostgreSQL for Complex Queries**: Full-text search, complex filters
3. **Implement TTL**: Automatic cleanup prevents table growth
4. **Monitor Costs**: Use CloudWatch to track DynamoDB usage
5. **Use GSI Sparingly**: Global Secondary Indexes add cost

## Migration Path

### Phase 1: Development (Current)
- DynamoDB Local for testing
- Both services write to DynamoDB and PostgreSQL
- Fallback to PostgreSQL if DynamoDB fails

### Phase 2: Production
- AWS DynamoDB tables
- IAM roles configured
- Monitoring and alerting

### Phase 3: Optimization
- OpenSearch/Elasticsearch for full-text search
- DynamoDB for simple queries and hot data
- PostgreSQL as source of truth

## Troubleshooting

### DynamoDB Connection Failed

**Error**: "Unable to connect to DynamoDB"

**Solutions:**
1. Verify DynamoDB Local is running: `docker compose ps dynamodb-local`
2. Check endpoint: `DYNAMODB_ENDPOINT=http://dynamodb-local:8000`
3. Test connection: `curl http://localhost:8000`

### Table Creation Failed

**Error**: "Table already exists" or "Access denied"

**Solutions:**
1. Check table name conflicts
2. Verify IAM permissions (production)
3. Check DynamoDB Local logs

### TTL Not Working

**Symptoms**: Items not expiring

**Solutions:**
1. Verify TTL attribute name: `DYNAMODB_TTL_ATTRIBUTE=ttl`
2. Check TTL value format (Unix timestamp in seconds)
3. Ensure TTL is enabled on table

## Related Documentation

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Local Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Deployment Guide](./DEPLOYMENT.md)
