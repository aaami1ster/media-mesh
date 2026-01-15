# MediaMesh Monorepo Structure

This document describes the NestJS monorepo structure for MediaMesh.

---

## 📁 Project Structure

```
media-mesh/
├── services/                    # All microservices
│   ├── api-gateway-discovery/  # Discovery Gateway (Port 8080)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   └── app.service.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api-gateway-cms/         # CMS Gateway (Port 8081)
│   ├── auth-service/            # Auth Service (Port 8086)
│   ├── cms-service/             # CMS Service (Port 8082)
│   ├── metadata-service/        # Metadata Service (Port 8083)
│   ├── media-service/           # Media Service (Port 8084)
│   ├── ingest-service/          # Ingest Service (Port 8085)
│   ├── discovery-service/       # Discovery Service (Port 8090)
│   └── search-service/          # Search Service (Port 8091)
├── shared/                      # Shared modules
│   ├── dto/                     # Shared DTOs
│   ├── events/                   # Kafka events
│   ├── guards/                  # Auth guards
│   ├── decorators/              # Custom decorators
│   ├── utils/                    # Utilities
│   ├── constants/               # Constants
│   ├── resilience/              # Resilience patterns
│   ├── observability/           # Observability utilities
│   ├── package.json
│   ├── tsconfig.json
│   └── index.ts                 # Main export
├── docker/                      # Docker scripts
├── docs/                        # Documentation
├── test/                        # E2E tests
├── package.json                 # Root package.json (workspaces)
├── tsconfig.json                # Root TypeScript config
├── tsconfig.base.json           # Base TypeScript config
├── nest-cli.json                # NestJS CLI config (monorepo)
├── eslint.config.mjs            # ESLint config
├── .prettierrc                  # Prettier config
├── compose.yml                  # Docker Compose
└── Dockerfile                   # Docker build file
```

---

## 🔧 Configuration Files

### Root `package.json`
- **Workspaces**: Configured for `services/*` and `shared`
- **Scripts**: 
  - `build:all` - Build all services
  - `lint:all` - Lint all services
  - `test:all` - Test all services

### `tsconfig.base.json`
- Base TypeScript configuration
- **Path aliases** for shared module:
  - `@shared/*` → `shared/*`
  - `@shared/dto` → `shared/dto`
  - `@shared/events` → `shared/events`
  - etc.

### `tsconfig.json`
- Extends `tsconfig.base.json`
- Project references for all services

### `nest-cli.json`
- Monorepo configuration
- All services defined as projects
- Each service has its own `tsconfig.json`

---

## 📦 Service Structure

Each service follows this structure:

```
service-name/
├── src/
│   ├── main.ts              # Application entry point
│   ├── app.module.ts        # Root module
│   ├── app.controller.ts    # Root controller
│   ├── app.service.ts        # Root service
│   └── ...                   # Feature modules
├── package.json              # Service dependencies
└── tsconfig.json             # Service TypeScript config
```

---

## 🔗 Using Shared Module

Import shared modules using path aliases:

```typescript
// In any service
import { UserDto } from '@shared/dto';
import { ContentCreatedEvent } from '@shared/events';
import { JwtAuthGuard } from '@shared/guards';
import { Roles } from '@shared/decorators';
import { UserRoles } from '@shared/constants';
```

---

## 🚀 Development Commands

### Build
```bash
# Build all services
npm run build:all

# Build specific service
npm run build --workspace=@mediamesh/api-gateway-discovery
```

### Run Services
```bash
# Run specific service in dev mode
npm run start:dev --workspace=@mediamesh/api-gateway-discovery

# Or use NestJS CLI
nest start api-gateway-discovery --watch
```

### Lint
```bash
# Lint all
npm run lint:all

# Lint specific service
npm run lint --workspace=@mediamesh/api-gateway-discovery
```

### Test
```bash
# Test all
npm run test:all

# Test specific service
npm run test --workspace=@mediamesh/api-gateway-discovery
```

---

## 📝 Adding a New Service

1. **Create service directory**:
   ```bash
   mkdir -p services/new-service/src
   ```

2. **Generate NestJS app**:
   ```bash
   nest generate app new-service
   ```

3. **Create package.json** (copy from existing service)

4. **Create tsconfig.json** (copy from existing service)

5. **Update root files**:
   - Add to `nest-cli.json` projects
   - Add to `tsconfig.json` references
   - Add to `compose.yml` (if needed)

---

## ✅ Verification

Check that everything is set up correctly:

```bash
# Verify workspaces
npm ls --workspaces

# Verify TypeScript compiles
npm run build:all

# Verify services can import shared
npm run lint:all
```

---

## 📚 Next Steps

1. Implement shared module components (DTOs, events, guards, etc.)
2. Build out each service following the development plan
3. Set up database connections per service
4. Configure Kafka producers/consumers
5. Add tests for each service
