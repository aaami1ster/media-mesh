# Global Exception Handler

This module provides a global exception filter for NestJS applications that ensures consistent error handling across all microservices.

## Features

- **Consistent Error Format**: All errors are returned in a standardized format
- **Correlation ID Support**: Tracks requests across services using correlation IDs
- **Security**: Hides internal error details in production
- **Comprehensive Logging**: Logs errors with appropriate levels
- **Custom Exceptions**: Provides business exception classes
- **Validation Error Handling**: Formats validation errors consistently

## Usage

### 1. Register the Global Filter

In your service's `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@shared/exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Register global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  await app.listen(3000);
}
bootstrap();
```

### 2. Use Custom Exceptions

```typescript
import { NotFoundException, ValidationException } from '@shared/exceptions';

// Throw a not found exception
throw new NotFoundException('User', userId);

// Throw a validation exception
throw new ValidationException('Invalid input', [
  { field: 'email', message: 'Email is required' },
  { field: 'password', message: 'Password must be at least 8 characters' },
]);
```

### 3. Error Response Format

All errors are returned in this format:

```json
{
  "statusCode": 404,
  "message": "User with identifier '123' not found",
  "error": "NOT_FOUND",
  "timestamp": "2024-01-16T12:00:00.000Z",
  "path": "/api/v1/users/123",
  "correlationId": "req-1234567890-abc123",
  "details": {}
}
```

## Custom Exception Classes

### BusinessException
Base class for all business exceptions.

```typescript
throw new BusinessException('Custom error message', 400, 'CUSTOM_ERROR', { additional: 'data' });
```

### NotFoundException
Resource not found (404).

```typescript
throw new NotFoundException('User', userId);
```

### ValidationException
Validation errors (400).

```typescript
throw new ValidationException('Validation failed', [
  { field: 'email', message: 'Invalid email format' },
]);
```

### UnauthorizedException
Authentication required (401).

```typescript
throw new UnauthorizedException('Invalid credentials');
```

### ForbiddenException
Authorization failed (403).

```typescript
throw new ForbiddenException('Insufficient permissions');
```

### ConflictException
Resource conflict (409).

```typescript
throw new ConflictException('Email already exists');
```

## Correlation ID

The filter automatically extracts correlation IDs from request headers:
- `x-correlation-id`
- `x-request-id`

If not present, it generates one automatically.

## Production vs Development

- **Development**: Full error messages and stack traces
- **Production**: Generic error messages, no stack traces

## Example Error Responses

### Validation Error
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than or equal to 8 characters"],
  "error": "Bad Request",
  "timestamp": "2024-01-16T12:00:00.000Z",
  "path": "/api/v1/auth/register",
  "correlationId": "req-1234567890-abc123",
  "details": {
    "validationErrors": ["email must be an email", "password must be longer than or equal to 8 characters"]
  }
}
```

### Not Found Error
```json
{
  "statusCode": 404,
  "message": "User with identifier '123' not found",
  "error": "NOT_FOUND",
  "timestamp": "2024-01-16T12:00:00.000Z",
  "path": "/api/v1/users/123",
  "correlationId": "req-1234567890-abc123"
}
```

### Internal Server Error (Production)
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "INTERNAL_SERVER_ERROR",
  "timestamp": "2024-01-16T12:00:00.000Z",
  "path": "/api/v1/users",
  "correlationId": "req-1234567890-abc123"
}
```
