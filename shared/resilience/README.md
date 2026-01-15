# Resilience Utilities

This module provides resilience patterns for handling failures, timeouts, and service degradation in microservices.

---

## 🛡️ Interceptors

### RetryInterceptor

Retries failed requests with exponential backoff.

**Features:**
- Configurable retry attempts
- Exponential backoff with jitter
- Retryable status codes and errors
- Automatic retry on transient failures

**Usage:**

```typescript
import { RetryInterceptor } from '@shared/resilience';

// Default config (3 attempts, 1s initial delay)
@UseInterceptors(RetryInterceptor)
@Get('data')
getData() {
  return this.httpService.get('...');
}

// Custom config
@UseInterceptors(
  new RetryInterceptor({
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    multiplier: 2,
  })
)
```

**Configuration:**
```typescript
{
  maxAttempts: 3,           // Maximum retry attempts
  initialDelay: 1000,        // Initial delay in ms
  maxDelay: 10000,          // Maximum delay in ms
  multiplier: 2,            // Exponential backoff multiplier
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
}
```

### CircuitBreakerInterceptor

Implements circuit breaker pattern to prevent cascading failures.

**Features:**
- Three states: CLOSED, OPEN, HALF_OPEN
- Automatic state transitions
- Failure threshold monitoring
- Service-specific circuit tracking

**Usage:**

```typescript
import { CircuitBreakerInterceptor, CircuitBreakerService } from '@shared/resilience';

// In module
@Module({
  providers: [CircuitBreakerService],
})
export class AppModule {}

// In controller
@UseInterceptors(CircuitBreakerInterceptor)
@Get('external-service')
callExternalService() {
  return this.httpService.get('...');
}

// With service name
@UseInterceptors(
  new CircuitBreakerInterceptor(circuitBreakerService, 'external-api')
)
```

**Circuit States:**
- **CLOSED**: Normal operation, requests allowed
- **OPEN**: Too many failures, requests rejected
- **HALF_OPEN**: Testing if service recovered, allows limited requests

**Configuration:**
```typescript
{
  failureThreshold: 5,       // Failures before opening circuit
  successThreshold: 2,       // Successes to close from half-open
  timeout: 60000,            // Time before attempting half-open (ms)
  resetTimeout: 300000,      // Time before resetting failure count (ms)
  monitoringPeriod: 60000,   // Time window for counting failures (ms)
}
```

### TimeoutInterceptor

Adds timeout to requests to prevent hanging.

**Features:**
- Configurable timeout duration
- Automatic request cancellation
- Clear timeout error messages

**Usage:**

```typescript
import { TimeoutInterceptor } from '@shared/resilience';

// Default timeout (30 seconds)
@UseInterceptors(TimeoutInterceptor)
@Get('slow-endpoint')
slowEndpoint() {
  return this.slowService.getData();
}

// Custom timeout
@UseInterceptors(
  new TimeoutInterceptor({ timeout: 60000, timeoutMessage: 'Request took too long' })
)
```

**Configuration:**
```typescript
{
  timeout: 30000,            // Timeout in milliseconds
  timeoutMessage: 'Request timeout',
}
```

---

## 🔧 Services

### CircuitBreakerService

Manages circuit breaker state for multiple services.

```typescript
import { CircuitBreakerService } from '@shared/resilience';

constructor(private circuitBreaker: CircuitBreakerService) {}

// Check if service is available
if (this.circuitBreaker.canExecute('external-api')) {
  // Make request
}

// Record success/failure
this.circuitBreaker.recordSuccess('external-api');
this.circuitBreaker.recordFailure('external-api');

// Get current state
const state = this.circuitBreaker.getState('external-api');
```

### HttpRetryService

Utility for retrying HTTP requests programmatically.

```typescript
import { HttpRetryService } from '@shared/resilience';

constructor(private httpRetry: HttpRetryService) {}

async fetchData() {
  return this.httpRetry.retry(async () => {
    const response = await this.httpService.get('...');
    return response.data;
  }, {
    maxAttempts: 5,
    initialDelay: 2000,
  });
}
```

---

## 📊 Combined Usage

Use multiple interceptors together:

```typescript
import {
  RetryInterceptor,
  CircuitBreakerInterceptor,
  TimeoutInterceptor,
  CircuitBreakerService,
} from '@shared/resilience';

@Controller('api')
@UseInterceptors(
  TimeoutInterceptor,           // First: timeout protection
  CircuitBreakerInterceptor,    // Second: circuit breaker
  RetryInterceptor,             // Third: retry on failures
)
export class ApiController {
  constructor(private circuitBreaker: CircuitBreakerService) {}
  
  @Get('external')
  callExternal() {
    return this.httpService.get('...');
  }
}
```

**Interceptor Order Matters:**
1. TimeoutInterceptor - First to prevent hanging
2. CircuitBreakerInterceptor - Check if service is available
3. RetryInterceptor - Retry on failures

---

## ⚙️ Configuration

### Global Configuration

Set default configurations via environment variables:

```env
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_DELAY=1000
RETRY_MAX_DELAY=10000

CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000

REQUEST_TIMEOUT=30000
```

### Per-Service Configuration

```typescript
// Different configs for different services
const externalApiRetry = new RetryInterceptor({
  maxAttempts: 5,
  initialDelay: 2000,
});

const internalApiRetry = new RetryInterceptor({
  maxAttempts: 3,
  initialDelay: 500,
});
```

---

## 📈 Monitoring

### Circuit Breaker Metrics

```typescript
const state = circuitBreaker.getState('service-name');
console.log(`Circuit state: ${state}`); // CLOSED, OPEN, or HALF_OPEN
```

### Retry Metrics

The RetryInterceptor logs:
- Retry attempts
- Delay between retries
- Final success/failure

---

## 🎯 Best Practices

1. **Use Timeout First**: Always apply timeout before other interceptors
2. **Circuit Breaker for External Services**: Use for calls to external APIs
3. **Retry for Transient Failures**: Only retry on retryable errors
4. **Monitor Circuit States**: Track circuit breaker states in production
5. **Tune Thresholds**: Adjust based on service characteristics
6. **Use Jitter**: Exponential backoff includes jitter to prevent thundering herd

---

## 🔍 Example: Complete Resilience Setup

```typescript
import { Module } from '@nestjs/common';
import {
  RetryInterceptor,
  CircuitBreakerInterceptor,
  TimeoutInterceptor,
  CircuitBreakerService,
} from '@shared/resilience';

@Module({
  providers: [CircuitBreakerService],
})
export class AppModule {}

@Controller('external')
@UseInterceptors(
  new TimeoutInterceptor({ timeout: 30000 }),
  new CircuitBreakerInterceptor(circuitBreakerService, 'external-api'),
  new RetryInterceptor({
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
  }),
)
export class ExternalController {
  @Get('data')
  getData() {
    return this.httpService.get('https://external-api.com/data');
  }
}
```

---

## 📚 Additional Resources

- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
