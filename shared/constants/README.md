# Constants Module

This module provides centralized constants for use across MediaMesh microservices.

---

## 📦 Categories

### 1. User Roles (`user-roles.constant.ts`)

Defines user roles and role-based access control utilities.

**Exports:**
- `UserRoles` enum - ADMIN, EDITOR, USER
- `UserRoleNames` - Display names for roles
- `UserRoleHierarchy` - Permission hierarchy
- `hasRolePermission()` - Check if role has permission
- `getAllRoles()` - Get all roles
- `isValidRole()` - Validate role

**Usage:**

```typescript
import { UserRoles, hasRolePermission } from '@shared/constants';

// Check role
if (user.role === UserRoles.ADMIN) {
  // Admin access
}

// Check permission
if (hasRolePermission(user.role, UserRoles.EDITOR)) {
  // User has editor or higher permissions
}
```

---

### 2. Event Names (`event-names.constant.ts`)

Centralized event name constants for Kafka event streaming.

**Exports:**
- `ContentEvents` - Content-related events
- `IngestEvents` - Ingest-related events
- `MetadataEvents` - Metadata-related events
- `MediaEvents` - Media-related events
- `AuthEvents` - Authentication-related events
- `SearchEvents` - Search-related events
- `DiscoveryEvents` - Discovery-related events
- `EventNames` - All event names
- `isValidEventName()` - Validate event name

**Usage:**

```typescript
import { ContentEvents, EventNames } from '@shared/constants';

// Publish event
await kafkaService.publish(ContentEvents.CREATED, {
  contentId: '123',
  title: 'New Content',
});

// Listen to event
@EventPattern(ContentEvents.CREATED)
handleContentCreated(data: ContentCreatedEvent) {
  // Handle event
}
```

**Event Categories:**
- **Content**: `content.created`, `content.updated`, `content.published`, etc.
- **Ingest**: `ingest.started`, `ingest.completed`, `ingest.failed`, etc.
- **Metadata**: `metadata.created`, `metadata.updated`, etc.
- **Media**: `media.uploaded`, `media.processed`, `media.failed`, etc.
- **Auth**: `auth.user.created`, `auth.user.login`, `auth.password.changed`, etc.
- **Search**: `search.indexed`, `search.query.executed`, etc.
- **Discovery**: `discovery.trending.updated`, `discovery.content.viewed`, etc.

---

### 3. API Version (`api-version.constant.ts`)

API versioning constants and utilities.

**Exports:**
- `API_VERSION` - Current API version (v1)
- `API_VERSION_PREFIX` - API version prefix (/api/v1)
- `SUPPORTED_API_VERSIONS` - Supported versions array
- `DEFAULT_API_VERSION` - Default version
- `API_VERSION_HEADER` - Header name (X-API-Version)
- `API_VERSION_QUERY` - Query parameter name (version)
- `isSupportedApiVersion()` - Check if version is supported
- `getApiVersionFromRequest()` - Extract version from request

**Usage:**

```typescript
import {
  API_VERSION_PREFIX,
  getApiVersionFromRequest,
  DEFAULT_API_VERSION,
} from '@shared/constants';

// Use in route definition
@Controller(`${API_VERSION_PREFIX}/users`)
export class UsersController {}

// Extract version from request
const version = getApiVersionFromRequest(req.headers, req.query);
```

---

### 4. Service Ports (`service-ports.constant.ts`)

Port numbers for all MediaMesh services.

**Exports:**
- `GatewayPorts` - Discovery Gateway (8080), CMS Gateway (8081)
- `ServicePorts` - All core service ports
- `InfrastructurePorts` - PostgreSQL, Redis, Kafka ports
- `AllServicePorts` - All ports combined
- `ServiceNameToPort` - Service name to port mapping
- `getPortByServiceName()` - Get port by service name
- `getServiceNameByPort()` - Get service name by port

**Usage:**

```typescript
import { ServicePorts, GatewayPorts, getPortByServiceName } from '@shared/constants';

// Use in service configuration
const port = process.env.PORT || ServicePorts.AUTH_SERVICE;

// Get port by name
const discoveryPort = getPortByServiceName('discovery-service'); // 8092
```

**Port Assignments:**
- **Gateways**: Discovery (8080), CMS (8081)
- **Services**: Auth (8001), CMS (8002), Metadata (8003), Media (8004), Ingest (8005), Discovery (8092), Search (8091)
- **Infrastructure**: PostgreSQL (5432), Redis (6379), Kafka (9092), Kafka UI (8090)

---

### 5. Error Codes (`error-codes.constant.ts`)

Centralized error codes for consistent error handling.

**Exports:**
- `GeneralErrorCodes` - Internal errors, timeouts, rate limits
- `ValidationErrorCodes` - Validation errors
- `AuthErrorCodes` - Authentication errors
- `AuthorizationErrorCodes` - Authorization errors
- `ResourceErrorCodes` - Not found, conflicts
- `ContentErrorCodes` - Content-specific errors
- `MediaErrorCodes` - Media-specific errors
- `IngestErrorCodes` - Ingest-specific errors
- `MetadataErrorCodes` - Metadata-specific errors
- `SearchErrorCodes` - Search-specific errors
- `DiscoveryErrorCodes` - Discovery-specific errors
- `DatabaseErrorCodes` - Database errors
- `ExternalServiceErrorCodes` - External service errors
- `ErrorCodes` - All error codes
- `ErrorCodeToHttpStatus` - Error code to HTTP status mapping
- `getHttpStatusForErrorCode()` - Get HTTP status for error code
- `isValidErrorCode()` - Validate error code

**Usage:**

```typescript
import {
  ErrorCodes,
  ContentErrorCodes,
  getHttpStatusForErrorCode,
} from '@shared/constants';

// Throw with error code
throw new BusinessException(
  'Content not found',
  getHttpStatusForErrorCode(ContentErrorCodes.CONTENT_NOT_FOUND),
  ContentErrorCodes.CONTENT_NOT_FOUND,
);

// Check error code
if (error.code === ContentErrorCodes.CONTENT_NOT_FOUND) {
  // Handle not found
}
```

**Error Code Categories:**
- **General**: `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `TIMEOUT`, `RATE_LIMIT_EXCEEDED`
- **Validation**: `VALIDATION_ERROR`, `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`
- **Auth**: `UNAUTHORIZED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`
- **Authorization**: `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS`, `ROLE_REQUIRED`
- **Resource**: `NOT_FOUND`, `ALREADY_EXISTS`, `CONFLICT`
- **Content**: `CONTENT_NOT_FOUND`, `CONTENT_INVALID_STATUS`, `CONTENT_PUBLISH_FAILED`
- **Media**: `MEDIA_NOT_FOUND`, `MEDIA_UPLOAD_FAILED`, `MEDIA_PROCESSING_FAILED`
- **Ingest**: `INGEST_NOT_FOUND`, `INGEST_FAILED`, `INGEST_CANCELLED`
- **Metadata**: `METADATA_NOT_FOUND`, `METADATA_EXTRACTION_FAILED`
- **Search**: `SEARCH_FAILED`, `INDEX_NOT_FOUND`, `QUERY_INVALID`
- **Discovery**: `DISCOVERY_FAILED`, `RECOMMENDATIONS_UNAVAILABLE`
- **Database**: `DATABASE_CONNECTION_FAILED`, `DATABASE_QUERY_FAILED`
- **External Service**: `EXTERNAL_SERVICE_UNAVAILABLE`, `EXTERNAL_SERVICE_TIMEOUT`

---

## 📚 Complete Example

```typescript
import {
  UserRoles,
  hasRolePermission,
  ContentEvents,
  API_VERSION_PREFIX,
  ServicePorts,
  ContentErrorCodes,
  getHttpStatusForErrorCode,
} from '@shared/constants';

@Controller(`${API_VERSION_PREFIX}/content`)
export class ContentController {
  constructor(
    private contentService: ContentService,
    private eventService: EventService,
  ) {}

  @Post()
  @Roles(UserRoles.EDITOR)
  async create(@Body() dto: CreateContentDto, @CurrentUser() user: RequestUser) {
    // Check permission
    if (!hasRolePermission(user.role, UserRoles.EDITOR)) {
      throw new ForbiddenException('Editor access required');
    }

    // Create content
    const content = await this.contentService.create(dto);

    // Publish event
    await this.eventService.publish(ContentEvents.CREATED, {
      contentId: content.id,
      userId: user.id,
    });

    return content;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const content = await this.contentService.findById(id);
    
    if (!content) {
      throw new BusinessException(
        'Content not found',
        getHttpStatusForErrorCode(ContentErrorCodes.CONTENT_NOT_FOUND),
        ContentErrorCodes.CONTENT_NOT_FOUND,
      );
    }

    return content;
  }
}
```

---

## 🎯 Best Practices

1. **Use constants instead of magic strings** - Always use constants for roles, events, error codes
2. **Centralized error codes** - Use error code constants for consistent error handling
3. **API versioning** - Use API version constants for route definitions
4. **Service ports** - Use port constants for service configuration
5. **Event names** - Use event name constants for Kafka event publishing
6. **Role hierarchy** - Use `hasRolePermission()` for role-based access checks

---

## 📝 Notes

- All constants are exported from `shared/constants/index.ts`
- Constants are fully typed with TypeScript
- Error codes map to HTTP status codes automatically
- Event names follow the pattern: `service.action` (e.g., `content.created`)
- Service ports match the configuration in `compose.yml` and `ecosystem.config.js`
