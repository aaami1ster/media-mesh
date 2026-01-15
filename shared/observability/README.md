# Observability Utilities

This module provides observability utilities for logging, tracing, metrics, and correlation ID tracking across microservices.

---

## 🔍 Components

### CorrelationIdMiddleware

Generates or propagates correlation IDs across requests for request tracing.

**Features:**
- Extracts correlation ID from headers (`x-correlation-id` or `x-request-id`)
- Generates new correlation ID if not present
- Adds correlation ID to response headers
- Attaches to request for use in controllers/services

**Usage:**

```typescript
import { CorrelationIdMiddleware } from '@shared/observability';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*');
  }
}
```

**Headers:**
- `x-correlation-id` - Correlation ID (generated or propagated)
- `x-request-id` - Alternative header name (also supported)

### TraceIdInterceptor

Adds trace IDs and span IDs to requests for distributed tracing.

**Features:**
- Generates trace ID per request
- Generates span ID per request
- Adds to request and response headers
- Supports distributed tracing

**Usage:**

```typescript
import { TraceIdInterceptor } from '@shared/observability';

@UseInterceptors(TraceIdInterceptor)
@Get('data')
getData() {
  return this.service.getData();
}
```

**Headers:**
- `x-trace-id` - Trace ID for distributed tracing
- `x-span-id` - Span ID for this request

### StructuredLoggerService

JSON-structured logging with Winston.

**Features:**
- JSON format in production
- Colorized output in development
- Correlation ID and trace ID support
- Context-aware logging
- Multiple log levels

**Usage:**

```typescript
import { StructuredLoggerService } from '@shared/observability';

constructor(private logger: StructuredLoggerService) {
  this.logger.setContext('MyService');
}

// Basic logging
this.logger.log('User logged in');
this.logger.error('Failed to process', error.stack);

// With correlation/trace IDs
this.logger.log('Request processed', 'MyController', correlationId, traceId);

// With metadata
this.logger.logWithMeta('info', 'User action', {
  userId: '123',
  action: 'login',
  ip: '192.168.1.1',
}, correlationId, traceId);
```

**Log Levels:**
- `log()` / `info` - Informational messages
- `error()` - Error messages
- `warn()` - Warning messages
- `debug()` - Debug messages
- `verbose()` - Verbose messages

**Configuration:**
```env
LOG_LEVEL=info  # debug, info, warn, error
SERVICE_NAME=my-service
NODE_ENV=production
```

### LoggingInterceptor

Logs all HTTP requests and responses with metadata.

**Features:**
- Logs request method, URL, status code
- Tracks request duration
- Includes correlation ID, trace ID, user ID
- Logs errors with stack traces
- Integrates with StructuredLoggerService

**Usage:**

```typescript
import { LoggingInterceptor, StructuredLoggerService } from '@shared/observability';

@Module({
  providers: [StructuredLoggerService],
})
export class AppModule {}

@Controller('api')
@UseInterceptors(LoggingInterceptor)
export class ApiController {}
```

**Log Output:**
```json
{
  "type": "request",
  "method": "GET",
  "url": "/api/users",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "correlationId": "corr-1234567890-abc123",
  "traceId": "trace-1234567890-def456",
  "userId": "user-123",
  "timestamp": "2024-01-16T12:00:00.000Z"
}
```

### MetricsCollectorService

Collects basic metrics for observability.

**Features:**
- Request count (total, success, failure)
- Latency metrics (average, min, max)
- Status code distribution
- Method distribution
- Per-endpoint metrics

**Usage:**

```typescript
import { MetricsCollectorService } from '@shared/observability';

constructor(private metrics: MetricsCollectorService) {}

// Record a request
this.metrics.recordRequest('GET', '/api/users', 200, 150);

// Record an error
this.metrics.recordError('GET', '/api/users', error);

// Get metrics
const endpointMetrics = this.metrics.getMetrics('GET', '/api/users');
const allMetrics = this.metrics.getAllMetrics();
const aggregated = this.metrics.getAggregatedMetrics();
```

**Metrics Structure:**
```typescript
{
  totalRequests: 1000,
  successfulRequests: 950,
  failedRequests: 50,
  averageLatency: 150.5,
  minLatency: 50,
  maxLatency: 2000,
  requestsByStatus: {
    200: 900,
    201: 50,
    400: 30,
    500: 20,
  },
  requestsByMethod: {
    GET: 800,
    POST: 150,
    PUT: 30,
    DELETE: 20,
  },
}
```

---

## 📊 Complete Setup Example

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import {
  CorrelationIdMiddleware,
  TraceIdInterceptor,
  LoggingInterceptor,
  StructuredLoggerService,
  MetricsCollectorService,
} from '@shared/observability';

@Module({
  providers: [
    StructuredLoggerService,
    MetricsCollectorService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply correlation ID middleware to all routes
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*');
  }
}

@Controller('api')
@UseInterceptors(
  TraceIdInterceptor,      // Add trace IDs
  LoggingInterceptor,       // Log requests/responses
)
export class ApiController {
  constructor(
    private logger: StructuredLoggerService,
    private metrics: MetricsCollectorService,
  ) {
    this.logger.setContext('ApiController');
  }

  @Get('users')
  async getUsers(@CurrentUser() user: RequestUser) {
    const startTime = Date.now();
    
    try {
      const users = await this.userService.findAll();
      const duration = Date.now() - startTime;
      
      // Record metrics
      this.metrics.recordRequest('GET', '/api/users', 200, duration);
      
      // Log with context
      this.logger.log('Users retrieved successfully', 'ApiController');
      
      return users;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.recordError('GET', '/api/users', error);
      throw error;
    }
  }
}
```

---

## 🔗 Integration with LoggingInterceptor

The LoggingInterceptor can use StructuredLoggerService for better logging:

```typescript
@Module({
  providers: [StructuredLoggerService],
})
export class AppModule {}

@Controller('api')
@UseInterceptors(
  new LoggingInterceptor(structuredLoggerService),
)
export class ApiController {}
```

---

## 📈 Metrics Endpoint Example

Create a metrics endpoint to expose collected metrics:

```typescript
@Controller('metrics')
export class MetricsController {
  constructor(private metrics: MetricsCollectorService) {}

  @Get()
  @Public()
  getMetrics() {
    return {
      endpoints: Object.fromEntries(this.metrics.getAllMetrics()),
      aggregated: this.metrics.getAggregatedMetrics(),
    };
  }
}
```

---

## 🎯 Best Practices

1. **Always use CorrelationIdMiddleware** - Apply to all routes for request tracking
2. **Use TraceIdInterceptor** - For distributed tracing across services
3. **Structured logging in production** - Use JSON format for log aggregation
4. **Log levels** - Use appropriate log levels (debug in dev, info/warn/error in prod)
5. **Metrics collection** - Record metrics for all external calls
6. **Correlation ID propagation** - Pass correlation ID in HTTP headers to downstream services

---

## 🔧 Environment Variables

```env
# Logging
LOG_LEVEL=info                    # debug, info, warn, error
SERVICE_NAME=my-service           # Service name for logs
NODE_ENV=production              # Environment (affects log format)

# Metrics
METRICS_ENABLED=true             # Enable metrics collection
METRICS_RETENTION=3600           # Metrics retention in seconds
```

---

## 📚 Additional Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Distributed Tracing](https://opentelemetry.io/docs/concepts/distributed-tracing/)
- [Structured Logging](https://www.datadoghq.com/blog/json-logging-best-practices/)
