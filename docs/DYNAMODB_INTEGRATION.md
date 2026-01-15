# DynamoDB Integration Guide for MediaMesh

This guide explains how to integrate DynamoDB into MediaMesh for high-performance read operations.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Use Cases](#use-cases)
- [Table Design](#table-design)
- [Integration Steps](#integration-steps)
- [Code Examples](#code-examples)
- [Best Practices](#best-practices)
- [Migration Strategy](#migration-strategy)

---

## Overview

DynamoDB is used in MediaMesh for:
- **Discovery Service**: Hot data caching (popular programs, trending content)
- **Search Service**: Fast search indexes
- **Rate Limiting**: Distributed counters with automatic TTL

**Benefits**:
- Single-digit millisecond latency
- Auto-scaling
- Automatic TTL for data expiration
- Cost-effective for high-traffic scenarios

---

## Use Cases

### 1. Discovery Service - Hot Data

**Use DynamoDB for**:
- Popular programs (top 1000)
- Trending content
- Recently viewed programs
- Personalized recommendations

**Use PostgreSQL for**:
- Full program catalog
- Complex queries with joins
- Transactions

### 2. Search Service - Search Indexes

**Use DynamoDB for**:
- Fast content lookups by ID
- Category-based queries
- Language-based filtering

**Use PostgreSQL/Elasticsearch for**:
- Full-text search
- Complex search queries
- Search analytics

### 3. Rate Limiting - Distributed Counters

**Use DynamoDB for**:
- Distributed rate limit counters
- Automatic expiration (TTL)
- High-throughput writes

**Use Redis for**:
- Real-time rate limiting
- Sliding window calculations

---

## Table Design

### 1. Discovery Hot Data Table

```typescript
{
  TableName: 'mediamesh-discovery-hot-data',
  KeySchema: [
    { AttributeName: 'programId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'programId', AttributeType: 'S' },
    { AttributeName: 'category', AttributeType: 'S' },
    { AttributeName: 'popularityScore', AttributeType: 'N' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'CategoryIndex',
      KeySchema: [
        { AttributeName: 'category', KeyType: 'HASH' },
        { AttributeName: 'popularityScore', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  TimeToLiveSpecification: {
    Enabled: true,
    AttributeName: 'ttl'
  },
  BillingMode: 'ON_DEMAND' // or PROVISIONED
}
```

**Items Structure**:
```json
{
  "programId": "prog-123",
  "title": "Program Title",
  "description": "Description",
  "category": "entertainment",
  "popularityScore": 9500,
  "viewCount": 150000,
  "thumbnailUrl": "https://...",
  "metadata": { ... },
  "ttl": 1735689600 // Unix timestamp (30 days)
}
```

### 2. Search Index Table

```typescript
{
  TableName: 'mediamesh-search-index',
  KeySchema: [
    { AttributeName: 'contentId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'contentId', AttributeType: 'S' },
    { AttributeName: 'contentType', AttributeType: 'S' },
    { AttributeName: 'category', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'ContentTypeIndex',
      KeySchema: [
        { AttributeName: 'contentType', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'CategoryIndex',
      KeySchema: [
        { AttributeName: 'category', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'ON_DEMAND'
}
```

### 3. Rate Limiting Table

```typescript
{
  TableName: 'mediamesh-rate-limits',
  KeySchema: [
    { AttributeName: 'key', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'key', AttributeType: 'S' }
  ],
  TimeToLiveSpecification: {
    Enabled: true,
    AttributeName: 'expiresAt'
  },
  BillingMode: 'ON_DEMAND'
}
```

**Items Structure**:
```json
{
  "key": "rate-limit:user:123:endpoint:/api/v1/search",
  "count": 45,
  "windowStart": 1735603200,
  "expiresAt": 1735603800 // TTL (1 hour window)
}
```

---

## Integration Steps

### Step 1: Install AWS SDK

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### Step 2: Configure DynamoDB Client

```typescript
// shared/config/dynamodb.config.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // Credentials from IAM role (in production) or environment variables (local)
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
});

export const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
```

### Step 3: Create DynamoDB Service

```typescript
// shared/services/dynamodb.service.ts
import { Injectable } from '@nestjs/common';
import { docClient } from '../config/dynamodb.config';
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamoDBService {
  async get(tableName: string, key: Record<string, any>) {
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: key,
      })
    );
    return result.Item;
  }

  async put(tableName: string, item: Record<string, any>) {
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );
  }

  async update(
    tableName: string,
    key: Record<string, any>,
    updateExpression: string,
    expressionAttributeValues: Record<string, any>
  ) {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
  }

  async query(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    indexName?: string
  ) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
    return result.Items || [];
  }

  async delete(tableName: string, key: Record<string, any>) {
    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: key,
      })
    );
  }
}
```

---

## Code Examples

### Discovery Service - Hot Data Caching

```typescript
// discovery-service/src/services/discovery.service.ts
import { Injectable } from '@nestjs/common';
import { DynamoDBService } from '@shared/services/dynamodb.service';
import { ProgramRepository } from '../repositories/program.repository';

@Injectable()
export class DiscoveryService {
  private readonly HOT_DATA_TABLE = 'mediamesh-discovery-hot-data';
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly dynamoDB: DynamoDBService,
    private readonly programRepository: ProgramRepository,
  ) {}

  async getPopularPrograms(limit: number = 50) {
    // Try DynamoDB first (hot data)
    try {
      const cached = await this.dynamoDB.get(this.HOT_DATA_TABLE, {
        programId: 'popular',
      });

      if (cached && cached.expiresAt > Date.now() / 1000) {
        return cached.programs.slice(0, limit);
      }
    } catch (error) {
      // Fallback to PostgreSQL if DynamoDB fails
      console.warn('DynamoDB cache miss, falling back to PostgreSQL', error);
    }

    // Fetch from PostgreSQL
    const programs = await this.programRepository.findPopular(limit);

    // Cache in DynamoDB (async, don't wait)
    this.cachePopularPrograms(programs).catch(console.error);

    return programs;
  }

  private async cachePopularPrograms(programs: any[]) {
    try {
      await this.dynamoDB.put(this.HOT_DATA_TABLE, {
        programId: 'popular',
        programs: programs,
        expiresAt: Math.floor(Date.now() / 1000) + this.CACHE_TTL,
        ttl: Math.floor(Date.now() / 1000) + this.CACHE_TTL,
      });
    } catch (error) {
      console.error('Failed to cache popular programs', error);
    }
  }

  async getProgramById(programId: string) {
    // Check DynamoDB for hot programs
    const cached = await this.dynamoDB.get(this.HOT_DATA_TABLE, {
      programId,
    });

    if (cached && cached.expiresAt > Date.now() / 1000) {
      return cached;
    }

    // Fetch from PostgreSQL
    const program = await this.programRepository.findById(programId);

    // Cache if it's popular (viewCount > threshold)
    if (program && program.viewCount > 10000) {
      this.cacheProgram(program).catch(console.error);
    }

    return program;
  }

  private async cacheProgram(program: any) {
    try {
      await this.dynamoDB.put(this.HOT_DATA_TABLE, {
        programId: program.id,
        ...program,
        expiresAt: Math.floor(Date.now() / 1000) + this.CACHE_TTL,
        ttl: Math.floor(Date.now() / 1000) + this.CACHE_TTL,
      });
    } catch (error) {
      console.error('Failed to cache program', error);
    }
  }

  async getTrendingByCategory(category: string, limit: number = 20) {
    // Query DynamoDB GSI
    const items = await this.dynamoDB.query(
      this.HOT_DATA_TABLE,
      'category = :category',
      { ':category': category },
      'CategoryIndex'
    );

    if (items.length >= limit) {
      return items
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, limit);
    }

    // Fallback to PostgreSQL
    return this.programRepository.findTrendingByCategory(category, limit);
  }
}
```

### Search Service - Search Index

```typescript
// search-service/src/services/search.service.ts
import { Injectable } from '@nestjs/common';
import { DynamoDBService } from '@shared/services/dynamodb.service';

@Injectable()
export class SearchService {
  private readonly SEARCH_INDEX_TABLE = 'mediamesh-search-index';

  constructor(private readonly dynamoDB: DynamoDBService) {}

  async indexContent(contentId: string, content: any) {
    await this.dynamoDB.put(this.SEARCH_INDEX_TABLE, {
      contentId,
      contentType: content.type,
      title: content.title,
      description: content.description,
      category: content.category,
      language: content.language,
      tags: content.tags || [],
      indexedAt: new Date().toISOString(),
    });
  }

  async searchByContentType(contentType: string, query?: string) {
    const items = await this.dynamoDB.query(
      this.SEARCH_INDEX_TABLE,
      'contentType = :type',
      { ':type': contentType },
      'ContentTypeIndex'
    );

    if (query) {
      // Filter by query (client-side filtering for simple cases)
      // For complex search, use Elasticsearch
      return items.filter(
        (item) =>
          item.title?.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
      );
    }

    return items;
  }

  async searchByCategory(category: string) {
    return this.dynamoDB.query(
      this.SEARCH_INDEX_TABLE,
      'category = :category',
      { ':category': category },
      'CategoryIndex'
    );
  }

  async getById(contentId: string) {
    return this.dynamoDB.get(this.SEARCH_INDEX_TABLE, { contentId });
  }

  async deleteIndex(contentId: string) {
    await this.dynamoDB.delete(this.SEARCH_INDEX_TABLE, { contentId });
  }
}
```

### Rate Limiting with DynamoDB

```typescript
// shared/services/rate-limit.service.ts
import { Injectable } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';

@Injectable()
export class RateLimitService {
  private readonly RATE_LIMIT_TABLE = 'mediamesh-rate-limits';
  private readonly WINDOW_SIZE = 3600; // 1 hour

  constructor(private readonly dynamoDB: DynamoDBService) {}

  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number = this.WINDOW_SIZE
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % windowSeconds);
    const rateLimitKey = `${key}:${windowStart}`;
    const expiresAt = windowStart + windowSeconds;

    try {
      // Try to get current count
      const item = await this.dynamoDB.get(this.RATE_LIMIT_TABLE, {
        key: rateLimitKey,
      });

      const currentCount = item?.count || 0;

      if (currentCount >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: expiresAt,
        };
      }

      // Increment counter
      await this.dynamoDB.update(
        this.RATE_LIMIT_TABLE,
        { key: rateLimitKey },
        'SET #count = if_not_exists(#count, :zero) + :inc, expiresAt = :expiresAt',
        {
          ':zero': 0,
          ':inc': 1,
          ':expiresAt': expiresAt,
          '#count': 'count',
        }
      );

      return {
        allowed: true,
        remaining: limit - currentCount - 1,
        resetAt: expiresAt,
      };
    } catch (error) {
      // On error, allow the request (fail open)
      console.error('Rate limit check failed', error);
      return {
        allowed: true,
        remaining: limit,
        resetAt: expiresAt,
      };
    }
  }
}
```

---

## Best Practices

### 1. Use TTL for Automatic Cleanup

```typescript
// Always set TTL for temporary data
await this.dynamoDB.put(tableName, {
  ...item,
  ttl: Math.floor(Date.now() / 1000) + expirationSeconds,
});
```

### 2. Handle Errors Gracefully

```typescript
try {
  const item = await this.dynamoDB.get(tableName, key);
  return item;
} catch (error) {
  // Fallback to PostgreSQL
  console.warn('DynamoDB error, falling back to PostgreSQL', error);
  return this.postgresRepository.findById(key.id);
}
```

### 3. Use Batch Operations

```typescript
// Use batch writes for multiple items
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const items = programs.map(program => ({
  PutRequest: {
    Item: {
      programId: program.id,
      ...program,
      ttl: Math.floor(Date.now() / 1000) + 1800,
    },
  },
}));

await docClient.send(
  new BatchWriteCommand({
    RequestItems: {
      [tableName]: items,
    },
  })
);
```

### 4. Monitor Performance

```typescript
// Add performance monitoring
const startTime = Date.now();
const item = await this.dynamoDB.get(tableName, key);
const duration = Date.now() - startTime;

if (duration > 100) {
  console.warn(`Slow DynamoDB query: ${duration}ms`);
}
```

---

## Migration Strategy

### Phase 1: Dual Write (Both PostgreSQL and DynamoDB)

```typescript
async createProgram(program: CreateProgramDto) {
  // Write to PostgreSQL (source of truth)
  const created = await this.programRepository.create(program);

  // Write to DynamoDB (async, don't block)
  this.dynamoDB
    .put('mediamesh-discovery-hot-data', {
      programId: created.id,
      ...created,
      ttl: Math.floor(Date.now() / 1000) + 1800,
    })
    .catch(console.error);

  return created;
}
```

### Phase 2: Read from DynamoDB with Fallback

```typescript
async getProgram(id: string) {
  // Try DynamoDB first
  const cached = await this.dynamoDB
    .get('mediamesh-discovery-hot-data', { programId: id })
    .catch(() => null);

  if (cached) return cached;

  // Fallback to PostgreSQL
  return this.programRepository.findById(id);
}
```

### Phase 3: Full Migration (DynamoDB Primary)

Once validated, make DynamoDB the primary read source for hot data.

---

## Environment Variables

```bash
# .env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key  # Only for local development
AWS_SECRET_ACCESS_KEY=your-secret-key  # Only for local development

# DynamoDB Table Names
DYNAMODB_DISCOVERY_TABLE=mediamesh-discovery-hot-data
DYNAMODB_SEARCH_TABLE=mediamesh-search-index
DYNAMODB_RATE_LIMIT_TABLE=mediamesh-rate-limits
```

**Note**: In production (ECS/EKS), use IAM roles instead of access keys.

---

## Testing

### Local Testing with DynamoDB Local

```bash
# Run DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Set endpoint
export AWS_ENDPOINT_URL=http://localhost:8000
```

```typescript
// Test configuration
const dynamoDBClient = new DynamoDBClient({
  region: 'local',
  endpoint: process.env.AWS_ENDPOINT_URL,
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});
```

---

## Cost Optimization

1. **Use On-Demand** for unpredictable traffic
2. **Use Provisioned** for predictable workloads (cheaper)
3. **Enable Auto-Scaling** for provisioned tables
4. **Use TTL** to automatically delete expired data
5. **Minimize GSI** (each GSI costs extra)
6. **Use Batch Operations** to reduce write costs

---

For more details, see:
- [AWS Deployment Guide](./AWS_DEPLOYMENT.md)
- [Scalability Guide](../SCALABILITY_GUIDE.md)
