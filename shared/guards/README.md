# Authentication & Authorization Guards

This module provides JWT authentication and role-based access control (RBAC) guards for NestJS applications.

---

## 🔐 Guards

### JwtAuthGuard

Validates JWT tokens from the `Authorization` header. Automatically skips authentication for routes marked with `@Public()` decorator.

**Features:**
- Extracts JWT from `Authorization: Bearer <token>` header
- Validates token using `@nestjs/jwt`
- Attaches user object to request
- Supports public routes via `@Public()` decorator

**Usage:**

```typescript
// Global guard (in app.module.ts)
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@shared/guards';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

// Or on specific controller/route
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/guards';

@Controller('protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {}
```

### RolesGuard

Enforces role-based access control. Must be used after `JwtAuthGuard`.

**Features:**
- Checks user role against required roles from `@Roles()` decorator
- Throws `ForbiddenException` if user doesn't have required role
- Supports multiple roles (user needs at least one)

**Usage:**

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@shared/guards';
import { Roles } from '@shared/decorators';
import { UserRole } from '@shared/dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles(UserRole.ADMIN)
  getUsers() {
    // Only ADMIN can access
  }

  @Post('content')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  createContent() {
    // Both ADMIN and EDITOR can access
  }
}
```

---

## 🎨 Decorators

### @Public()

Marks an endpoint as public (no authentication required).

```typescript
import { Public } from '@shared/decorators';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return { status: 'ok' };
  }
}
```

### @Roles(...roles)

Specifies required roles for an endpoint.

```typescript
import { Roles } from '@shared/decorators';
import { UserRole } from '@shared/dto';

@Roles(UserRole.ADMIN) // Single role
@Roles(UserRole.ADMIN, UserRole.EDITOR) // Multiple roles (OR)
```

### @CurrentUser()

Extracts the authenticated user from the request.

```typescript
import { CurrentUser } from '@shared/decorators';
import { RequestUser } from '@shared/decorators/current-user.decorator';

@Get('profile')
getProfile(@CurrentUser() user: RequestUser) {
  return user;
}

@Get('user-id')
getUserId(@CurrentUser('id') userId: string) {
  return { userId };
}
```

---

## 📋 User Roles

Available roles (from `UserRole` enum):

- `ADMIN` - Full system access
- `EDITOR` - Content management access
- `USER` - Basic user access

---

## 🔧 Setup

### 1. Install Dependencies

Dependencies are already included in `shared/package.json`:
- `@nestjs/jwt` - JWT token handling

### 2. Configure JWT Module

In your service's `app.module.ts`:

```typescript
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '@shared/guards';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRATION || '24h',
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

### 3. Use Guards and Decorators

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@shared/guards';
import { Public, Roles, CurrentUser } from '@shared/decorators';
import { UserRole, RequestUser } from '@shared/dto';

@Controller('api')
export class ApiController {
  // Public endpoint
  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  // Protected endpoint (requires authentication)
  @Get('profile')
  getProfile(@CurrentUser() user: RequestUser) {
    return user;
  }

  // Admin-only endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  adminOnly() {
    return { message: 'Admin only' };
  }

  // Editor or Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post('content')
  createContent(@CurrentUser() user: RequestUser) {
    return { message: 'Content created', createdBy: user.id };
  }
}
```

---

## 🔑 JWT Token Format

The JWT payload should include:

```typescript
{
  sub: string; // or userId
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EDITOR' | 'USER';
  createdAt?: string;
  updatedAt?: string;
  iat?: number; // issued at
  exp?: number; // expiration
}
```

---

## 🛡️ Security Best Practices

1. **Use strong JWT secrets** - At least 256 bits
2. **Set appropriate expiration** - 24 hours for access tokens
3. **Use HTTPS** - Always in production
4. **Validate tokens** - Always verify signature and expiration
5. **Rotate secrets** - Periodically rotate JWT secrets
6. **Log access attempts** - Monitor authentication failures

---

## 🐛 Troubleshooting

### "No token provided"
- Check that `Authorization: Bearer <token>` header is present
- Verify token is not expired

### "Invalid or expired token"
- Check JWT_SECRET matches between services
- Verify token hasn't expired
- Check token format is correct

### "Insufficient permissions"
- User role doesn't match required roles
- Check `@Roles()` decorator configuration

---

## 📚 Additional Resources

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS Authorization](https://docs.nestjs.com/security/authorization)
- [JWT.io](https://jwt.io/) - JWT token decoder
