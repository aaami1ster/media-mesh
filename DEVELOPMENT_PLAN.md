# MediaMesh Development Plan

A comprehensive, step-by-step development plan to implement all features described in the README. Each step includes ready-to-use prompts for Cursor AI to efficiently build the platform.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Development Strategy](#development-strategy)
- [Milestones](#milestones)
  - [Milestone 1: Project Foundation & Infrastructure](#milestone-1-project-foundation--infrastructure)
  - [Milestone 2: Shared Module & Core Utilities](#milestone-2-shared-module--core-utilities)
  - [Milestone 3: Auth Service](#milestone-3-auth-service)
  - [Milestone 4: CMS Service](#milestone-4-cms-service)
  - [Milestone 5: Metadata Service](#milestone-5-metadata-service)
  - [Milestone 6: Media Service](#milestone-6-media-service)
  - [Milestone 7: Discovery Service](#milestone-7-discovery-service)
  - [Milestone 8: Ingest Service](#milestone-8-ingest-service)
  - [Milestone 9: Search/Indexing Service](#milestone-9-searchindexing-service)
  - [Milestone 10: CMS Gateway](#milestone-10-cms-gateway)
  - [Milestone 11: Discovery Gateway](#milestone-11-discovery-gateway)
  - [Milestone 12: Docker & Deployment](#milestone-12-docker--deployment)
  - [Milestone 13: Testing & Documentation](#milestone-13-testing--documentation)
  - [Milestone 14: Observability & Monitoring](#milestone-14-observability--monitoring)
- [Quick Reference: Cursor Prompts](#quick-reference-cursor-prompts)

---

## Overview

This plan breaks down the MediaMesh platform implementation into **14 milestones**, each building upon the previous one. Each milestone contains:

- **Objective**: What we're building
- **Prerequisites**: What must be completed first
- **Steps**: Detailed implementation steps
- **Cursor Prompts**: Ready-to-use prompts for each step
- **Validation**: How to verify the milestone is complete

**Estimated Timeline**: 8-12 weeks (depending on team size and complexity)

---

## Development Strategy

### Approach
1. **Bottom-Up**: Start with shared modules and infrastructure, then build services
2. **Incremental**: Each service is independently deployable and testable
3. **Test-Driven**: Write tests alongside implementation
4. **Documentation**: Keep Swagger/OpenAPI docs updated as we build

### Service Build Order
1. Shared Module (foundation)
2. Auth Service (needed by gateways)
3. Core Services (CMS, Metadata, Media)
4. Discovery Service
5. Ingest Service
6. Search Service
7. Gateways (CMS, Discovery)
8. Infrastructure & Deployment

---

## Milestones

---

## Milestone 1: Project Foundation & Infrastructure

**Objective**: Set up project structure, monorepo configuration, and infrastructure services (Docker Compose).

**Prerequisites**: None

**Estimated Time**: 2-3 days

### Step 1.1: Initialize Monorepo Structure

**Cursor Prompt**:
```
Create a NestJS monorepo structure for MediaMesh with the following structure:
- Root package.json with workspace configuration
- services/ directory for all microservices
- shared/ directory for shared modules
- compose.yml for infrastructure (PostgreSQL, Redis, Kafka)
- tsconfig.json and tsconfig.base.json for TypeScript configuration
- .gitignore, .eslintrc, .prettierrc
- README.md (already exists, keep it)

Each service should be a NestJS application. Use NestJS CLI to generate the structure.
Set up proper TypeScript path aliases for shared module imports.
```

### Step 1.2: Docker Compose Infrastructure

**Cursor Prompt**:
```
Create a compose.yml file that sets up:
1. PostgreSQL 16 (multiple instances: auth_db, cms_db, metadata_db, media_db, discovery_db, ingest_db, search_db)
2. Redis 7 for caching and rate limiting
3. Kafka for event streaming
4. Kafka UI for monitoring (port 8092)

Each database should have:
- Unique name and port
- Environment variables for credentials
- Volume mounts for data persistence
- Health checks

Configure networks so services can communicate.
```

### Step 1.3: PM2 Ecosystem Configuration

**Cursor Prompt**:
```
Create an ecosystem.config.js file for PM2 that:
- Defines all microservices (gateways and services)
- Configures log paths, instances, and restart policies
- Sets environment variables per service
- Configures PM2 cluster mode for gateways (optional scaling)

Services to include:
- api-gateway-discovery (port 8080)
- api-gateway-cms (port 8081)
- auth-service (port 8086)
- cms-service (port 8082)
- metadata-service (port 8083)
- media-service (port 8084)
- ingest-service (port 8085)
- discovery-service (port 8092)
- search-service (port 8091)
```

### Step 1.4: Root Package Scripts

**Cursor Prompt**:
```
Update root package.json with scripts for:
- build:all - build all services
- start:dev - start all services in dev mode
- start:prod - start all services in prod mode
- test:all - run all tests
- lint:all - lint all services
- format - format all code

Use npm workspaces or pnpm workspaces to manage dependencies across services.
```

**Validation**:
- [x] All services can be generated with NestJS CLI
- [x] Docker Compose starts all infrastructure services
- [x] PM2 can start services (even if empty)
- [x] TypeScript compiles without errors
- [x] Shared module can be imported from services

---

## Milestone 2: Shared Module & Core Utilities

**Objective**: Build the shared module with DTOs, events, guards, resilience utilities, and observability helpers.

**Prerequisites**: Milestone 1 complete

**Estimated Time**: 5-7 days

### Step 2.1: Shared Module Structure

**Cursor Prompt**:
```
Create the shared module structure in shared/ directory:
- dto/ - shared DTOs and interfaces
- events/ - Kafka event schemas and types
- guards/ - JWT guards, RBAC guards
- decorators/ - custom decorators (Roles, CurrentUser, etc.)
- resilience/ - retry and circuit breaker utilities
- observability/ - logging, tracing, correlation ID utilities
- utils/ - common utilities (errors, pagination, validation)
- constants/ - shared constants (roles, event types, etc.)

Set up proper TypeScript exports and package.json for the shared module.
```

### Step 2.2: DTOs & Contracts

**Cursor Prompt**:
```
Create shared DTOs in shared/dto/:
- Common DTOs: PaginationDto, PaginatedResponseDto, ErrorResponseDto
- Auth DTOs: LoginDto, RegisterDto, TokenResponseDto, UserDto
- Content DTOs: ProgramDto, EpisodeDto, CreateProgramDto, UpdateProgramDto
- Metadata DTOs: MetadataDto, CreateMetadataDto
- Media DTOs: MediaDto, UploadMediaDto
- Discovery DTOs: SearchQueryDto, SearchResponseDto

Use class-validator for validation. Export all DTOs from index.ts.
```

### Step 2.3: Kafka Events

**Cursor Prompt**:
```
Create Kafka event schemas in shared/events/:
- Event types enum: ContentEventType, IngestEventType, AuthEventType, SearchEventType
- Event interfaces: ContentCreatedEvent, ContentUpdatedEvent, ContentPublishedEvent, IngestCompletedEvent, IngestFailedEvent, UserCreatedEvent
- Event serializers/deserializers
- Event versioning utilities

Use Avro or JSON schema for event validation. Export event types and interfaces.
```

### Step 2.4: Guards & Decorators

**Cursor Prompt**:
```
Create authentication and authorization utilities in shared/guards/ and shared/decorators/:
- JwtAuthGuard - validates JWT tokens
- RolesGuard - enforces RBAC (ADMIN, EDITOR, USER)
- @Roles() decorator - specify required roles
- @CurrentUser() decorator - extract user from request
- @Public() decorator - mark endpoints as public

Use @nestjs/jwt and @nestjs/passport. Support role-based access control.
```

### Step 2.5: Resilience Utilities

**Cursor Prompt**:
```
Create resilience utilities in shared/resilience/:
- RetryInterceptor - retry failed requests with exponential backoff
- CircuitBreakerInterceptor - circuit breaker pattern for service calls
- TimeoutInterceptor - request timeout handling
- Configuration for retry attempts, backoff strategy, circuit breaker thresholds

Use libraries like @nestjs/axios-retry or implement custom interceptors.
Export interceptors and configuration.
```

### Step 2.6: Observability Utilities

**Cursor Prompt**:
```
Create observability utilities in shared/observability/:
- CorrelationIdMiddleware - generate/propagate correlation IDs
- TraceIdInterceptor - add trace IDs to requests
- StructuredLogger - JSON logger with correlation/trace IDs
- LoggingInterceptor - log requests/responses with metadata
- MetricsCollector - basic metrics (request count, latency, errors)

Use winston or pino for structured logging. Export all utilities.
```

### Step 2.7: Common Utilities

**Cursor Prompt**:
```
Create common utilities in shared/utils/:
- Custom exceptions (NotFoundException, UnauthorizedException, etc.)
- Pagination helpers (create pagination metadata)
- Validation utilities
- Date/time utilities
- String utilities

Export all utilities from index.ts.
```

### Step 2.8: Constants

**Cursor Prompt**:
```
Create constants in shared/constants/:
- UserRoles enum (ADMIN, EDITOR, USER)
- Event names constants
- API version constants
- Service ports constants
- Error codes

Export all constants.
```

**Validation**:
- [x] All shared modules compile
- [x] DTOs have proper validation
- [x] Guards can be used in services
- [x] Event schemas are defined
- [x] Observability utilities work
- [x] Resilience utilities are testable

---

## Milestone 3: Auth Service

**Objective**: Build the authentication service with JWT, user management, and role management.

**Prerequisites**: Milestone 2 complete

**Estimated Time**: 4-5 days

### Step 3.1: Auth Service Setup

**Cursor Prompt**:
```
Create auth-service in services/auth-service/:
- NestJS application structure
- Database connection to auth_db (Prisma)
- User entity with: id, email, password (hashed), role, createdAt, updatedAt
- User repository/service
- Install @nestjs/jwt, @nestjs/passport, bcrypt, passport-jwt
```

### Step 3.2: User Entity & Database

**Cursor Prompt**:
```
Create User entity and database setup:
- User entity with email (unique), password (hashed), role (enum: ADMIN, EDITOR, USER)
- Database migration for users table
- UserRepository with methods: findByEmail, findById, create, update
- Seed script to create initial admin user
```

### Step 3.3: Authentication Module

**Cursor Prompt**:
```
Create authentication module in auth-service:
- AuthController with endpoints: POST /auth/login, POST /auth/register, POST /auth/refresh
- AuthService with methods: login, register, validateUser, generateToken, refreshToken
- JWT strategy for token validation
- Password hashing with bcrypt
- Token generation with configurable expiration
```

### Step 3.4: Auth Service API

**Cursor Prompt**:
```
Implement auth-service REST API:
- POST /auth/login - accepts LoginDto, returns TokenResponseDto with JWT
- POST /auth/register - accepts RegisterDto, creates user, returns TokenResponseDto
- POST /auth/refresh - refreshes JWT token
- GET /auth/me - returns current user info (protected)
- Use class-validator for DTO validation
- Add Swagger/OpenAPI documentation
```

### Step 3.5: Kafka Events (Auth)

**Cursor Prompt**:
```
Add Kafka producer to auth-service:
- Emit user.created event when user registers
- Emit user.updated event when user is updated
- Use shared event schemas from shared module
- Configure Kafka connection
```

### Step 3.6: Auth Service Tests

**Cursor Prompt**:
```
Write tests for auth-service:
- Unit tests for AuthService (login, register, token generation)
- Integration tests for AuthController endpoints
- Test password hashing and JWT generation
- Test role-based access
```

**Validation**:
- [x] Auth service starts and connects to database
- [ ] Can register new users
- [ ] Can login and receive JWT token
- [ ] JWT token validates correctly
- [ ] Roles are assigned correctly
- [ ] Kafka events are emitted
- [x] Tests pass

---

## Milestone 4: CMS Service

**Objective**: Build the CMS service for managing programs and episodes with publishing workflow.

**Prerequisites**: Milestone 2 complete, Milestone 3 in progress (can work in parallel)

**Estimated Time**: 5-6 days

### Step 4.1: CMS Service Setup

**Cursor Prompt**:
```
Create cms-service in services/cms-service/:
- NestJS application structure
- Database connection to cms_db
- Program entity: id, title, description, status (draft/published), createdAt, updatedAt, publishedAt
- Episode entity: id, programId (FK), title, description, episodeNumber, duration, status, createdAt, updatedAt
- Install Prisma
```

### Step 4.2: Program & Episode Entities

**Cursor Prompt**:
```
Create Program and Episode entities:
- Program: id, title, description, status (enum: DRAFT, PUBLISHED), metadataId (optional FK), createdAt, updatedAt, publishedAt
- Episode: id, programId (FK), title, description, episodeNumber, duration, status, metadataId (optional), createdAt, updatedAt
- Database migrations
- Relationships: Program has many Episodes
```

### Step 4.3: CMS Service Logic

**Cursor Prompt**:
```
Create CMS service logic:
- ProgramService: create, findAll, findOne, update, delete, publish, unpublish
- EpisodeService: create, findAllByProgram, findOne, update, delete
- Implement publishing workflow (draft -> published)
- Add validation and business rules
```

### Step 4.4: CMS Service API

**Cursor Prompt**:
```
Implement cms-service REST API:
- Programs: GET /programs, GET /programs/:id, POST /programs, PUT /programs/:id, DELETE /programs/:id, POST /programs/:id/publish
- Episodes: GET /programs/:programId/episodes, GET /episodes/:id, POST /episodes, PUT /episodes/:id, DELETE /episodes/:id
- Use DTOs from shared module
- Add Swagger documentation
- Implement pagination
```

### Step 4.5: Kafka Events (Content)

**Cursor Prompt**:
```
Add Kafka producer to cms-service:
- Emit content.created when program/episode is created
- Emit content.updated when program/episode is updated
- Emit content.published when content is published
- Use shared event schemas
- Include full content data in events
```

### Step 4.6: CMS Service Tests

**Cursor Prompt**:
```
Write tests for cms-service:
- Unit tests for ProgramService and EpisodeService
- Integration tests for CMS endpoints
- Test publishing workflow
- Test relationships between programs and episodes
```

**Validation**:
- [x] CMS service starts and connects to database
- [ ] Can create/read/update/delete programs
- [ ] Can create/read/update/delete episodes
- [ ] Publishing workflow works
- [ ] Kafka events are emitted correctly
- [ ] Tests pass

---

## Milestone 5: Metadata Service

**Objective**: Build the metadata service for storing and validating content metadata.

**Prerequisites**: Milestone 2 complete

**Estimated Time**: 3-4 days

### Step 5.1: Metadata Service Setup

**Cursor Prompt**:
```
Create metadata-service in services/metadata-service/:
- NestJS application structure
- Database connection to metadata_db
- Metadata entity: id, title, description, category, language, duration, publishDate, contentId, contentType (program/episode), createdAt, updatedAt
- Install Prisma
```

### Step 5.2: Metadata Entity & Schema

**Cursor Prompt**:
```
Create Metadata entity:
- Fields: id, title, description, category (enum), language, duration (seconds), publishDate, contentId, contentType (enum: PROGRAM, EPISODE), version, createdAt, updatedAt
- Database migration
- Validation rules (required fields, format validation)
- Version tracking for metadata changes
```

### Step 5.3: Metadata Service Logic

**Cursor Prompt**:
```
Create MetadataService:
- Methods: create, findByContentId, update, validate, getVersionHistory
- Implement metadata validation (schema validation)
- Support metadata versioning
- Ensure consistent schema across content types
```

### Step 5.4: Metadata Service API

**Cursor Prompt**:
```
Implement metadata-service REST API:
- POST /metadata - create metadata
- GET /metadata/:id - get metadata by ID
- GET /metadata/content/:contentId - get metadata by content ID
- PUT /metadata/:id - update metadata
- GET /metadata/:id/versions - get version history
- Add Swagger documentation
```

### Step 5.5: Metadata Service Tests

**Cursor Prompt**:
```
Write tests for metadata-service:
- Unit tests for MetadataService
- Integration tests for metadata endpoints
- Test validation rules
- Test versioning
```

**Validation**:
- [x] Metadata service starts and connects to database
- [ ] Can create and retrieve metadata
- [ ] Validation works correctly
- [ ] Versioning works
- [x] Tests pass

---

## Milestone 6: Media Service

**Objective**: Build the media service for managing media assets and object storage integration.

**Prerequisites**: Milestone 2 complete

**Estimated Time**: 4-5 days

### Step 6.1: Media Service Setup

**Cursor Prompt**:
```
Create media-service in services/media-service/:
- NestJS application structure
- Database connection to media_db
- Media entity: id, contentId, contentType, url, thumbnailUrl, storageType (S3/Spaces/MinIO), storageKey, fileSize, mimeType, createdAt
- Install @aws-sdk/client-s3 or similar for object storage
```

### Step 6.2: Media Entity & Storage

**Cursor Prompt**:
```
Create Media entity:
- Fields: id, contentId, contentType (PROGRAM/EPISODE), url (CDN URL), thumbnailUrl, storageType, storageKey, fileSize, mimeType, createdAt
- Database migration
- Object storage client configuration (S3)
- Support for multiple storage backends
```

### Step 6.3: Media Service Logic

**Cursor Prompt**:
```
Create MediaService:
- Methods: upload, findByContentId, delete, generateThumbnail, getCDNUrl
- Implement file upload to object storage
- Generate CDN URLs
- Handle thumbnails
- Support multiple storage providers
```

### Step 6.4: Media Service API

**Cursor Prompt**:
```
Implement media-service REST API:
- POST /media/upload - upload media file (multipart/form-data)
- GET /media/:id - get media by ID
- GET /media/content/:contentId - get media by content ID
- DELETE /media/:id - delete media
- POST /media/:id/thumbnail - generate thumbnail
- Add Swagger documentation
- Use file upload middleware
```

### Step 6.5: Object Storage Integration

**Cursor Prompt**:
```
Implement object storage integration:
- Support for AWS S3, DigitalOcean Spaces, MinIO
- Configuration via environment variables
- Generate presigned URLs for uploads
- CDN URL generation
- Error handling for storage operations
```

### Step 6.6: Media Service Tests

**Cursor Prompt**:
```
Write tests for media-service:
- Unit tests for MediaService
- Integration tests for upload/download
- Mock object storage for testing
- Test CDN URL generation
```

**Validation**:
- [x] Media service starts and connects to database
- [ ] Can upload files to object storage
- [ ] CDN URLs are generated correctly
- [ ] Thumbnails can be created
- [x] Tests pass

---

## Milestone 7: Discovery Service

**Objective**: Build the discovery service for public search and browse APIs with Redis caching.

**Prerequisites**: Milestone 2, 4, 5, 6 complete

**Estimated Time**: 4-5 days

### Step 7.1: Discovery Service Setup

**Cursor Prompt**:
```
Create discovery-service in services/discovery-service/:
- NestJS application structure
- Database connection to discovery_db (read-only replica or cache)
- Redis client for caching
- Install @nestjs/cache-manager, cache-manager-redis-store
```

### Step 7.2: Discovery Service Logic

**Cursor Prompt**:
```
Create DiscoveryService:
- Methods: search, getPrograms, getProgram, getEpisodes, getTrending, getPopular
- Implement Redis caching with TTL (cache-aside pattern)
- Cache hot reads (popular programs, trending content)
- Query optimization
```

### Step 7.3: Discovery Service API

**Cursor Prompt**:
```
Implement discovery-service REST API:
- GET /discovery/search?q=... - search programs/episodes
- GET /discovery/programs - list programs (paginated, filtered)
- GET /discovery/programs/:id - get program details
- GET /discovery/programs/:id/episodes - get episodes for program
- GET /discovery/trending - get trending content
- GET /discovery/popular - get popular content
- Add Swagger documentation
- Implement caching headers
```

### Step 7.4: Redis Caching

**Cursor Prompt**:
```
Implement Redis caching in discovery-service:
- Cache-aside pattern for programs and episodes
- TTL configuration (e.g., 5 minutes for programs, 1 minute for search results)
- Cache invalidation on content updates (listen to Kafka events)
- Cache key strategy (e.g., program:{id}, search:{query})
```

### Step 7.5: Discovery Service Tests

**Cursor Prompt**:
```
Write tests for discovery-service:
- Unit tests for DiscoveryService
- Integration tests for discovery endpoints
- Test caching behavior
- Test cache invalidation
```

**Validation**:
- [x] Discovery service starts and connects to Redis
- [ ] Can search and browse content
- [ ] Caching works correctly
- [ ] Cache invalidation works on updates
- [x] Tests pass

---

## Milestone 8: Ingest Service

**Objective**: Build the ingest service for importing content from external sources.

**Prerequisites**: Milestone 2, 4, 5, 6 complete

**Estimated Time**: 5-6 days

### Step 8.1: Ingest Service Setup

**Cursor Prompt**:
```
Create ingest-service in services/ingest-service/:
- NestJS application structure
- Database connection to ingest_db
- IngestJob entity: id, sourceType (YOUTUBE/RSS/API), sourceUrl, status (PENDING/PROCESSING/COMPLETED/FAILED), contentId, errorMessage, createdAt, updatedAt
- Install RSS parser, YouTube API client (or similar)
```

### Step 8.2: Ingest Job Entity

**Cursor Prompt**:
```
Create IngestJob entity:
- Fields: id, sourceType (enum), sourceUrl, status, contentId, metadata, errorMessage, retryCount, createdAt, updatedAt
- Database migration
- Track ingest job status and history
```

### Step 8.3: Ingest Service Logic

**Cursor Prompt**:
```
Create IngestService:
- Methods: createJob, processJob, processYouTube, processRSS, processAPI, normalizeContent
- Implement source-specific parsers (YouTube, RSS, API)
- Normalize imported data to internal models
- Handle errors and retries
- Support scheduled/periodic ingestion
```

### Step 8.4: Ingest Service API

**Cursor Prompt**:
```
Implement ingest-service REST API:
- POST /ingest/jobs - create ingest job
- GET /ingest/jobs - list ingest jobs
- GET /ingest/jobs/:id - get job status
- POST /ingest/jobs/:id/retry - retry failed job
- DELETE /ingest/jobs/:id - delete job
- Add Swagger documentation
```

### Step 8.5: Source Integrations

**Cursor Prompt**:
```
Implement source integrations:
- YouTube: fetch video metadata, thumbnails, descriptions
- RSS: parse RSS feeds, extract episodes
- Generic API: fetch from external APIs
- Normalize all sources to internal Program/Episode models
- Handle rate limiting and errors
```

### Step 8.6: Kafka Events (Ingest)

**Cursor Prompt**:
```
Add Kafka producer to ingest-service:
- Emit ingest.completed when job succeeds
- Emit ingest.failed when job fails
- Include job metadata and content IDs in events
- Use shared event schemas
```

### Step 8.7: Ingest Service Tests

**Cursor Prompt**:
```
Write tests for ingest-service:
- Unit tests for IngestService and parsers
- Integration tests for ingest endpoints
- Test source integrations (with mocks)
- Test error handling and retries
```

**Validation**:
- [x] Ingest service starts and connects to database
- [ ] Can create ingest jobs
- [ ] Can process YouTube/RSS/API sources
- [ ] Content is normalized correctly
- [ ] Kafka events are emitted
- [x] Tests pass

---

## Milestone 9: Search/Indexing Service

**Objective**: Build the search/indexing service that consumes Kafka events and maintains search indexes.

**Prerequisites**: Milestone 2, 4, 5, 6, 8 complete

**Estimated Time**: 4-5 days

### Step 9.1: Search Service Setup

**Cursor Prompt**:
```
Create search-service in services/search-service/:
- NestJS application structure
- Database connection to search_db
- Kafka consumer setup
- Install @nestjs/microservices for Kafka
- Optional: OpenSearch/Elasticsearch client (for future)
```

### Step 9.2: Kafka Consumer

**Cursor Prompt**:
```
Create Kafka consumer in search-service:
- Subscribe to content.events topic (content.created, content.updated, content.published)
- Subscribe to ingest.events topic (ingest.completed)
- Process events and update search index
- Handle consumer groups and offsets
- Implement error handling and retries
```

### Step 9.3: Search Index Logic

**Cursor Prompt**:
```
Create SearchService:
- Methods: indexContent, updateIndex, deleteFromIndex, search, reindexAll
- Maintain search index (initially in PostgreSQL, later migrate to OpenSearch/Elasticsearch)
- Support full-text search
- Index programs and episodes with metadata
```

### Step 9.4: Search Index Schema

**Cursor Prompt**:
```
Create search index schema:
- SearchIndex entity: id, contentId, contentType, title, description, category, language, tags, indexedAt
- Full-text search indexes on title and description
- Support for filtering by category, language, etc.
- Database migration
```

### Step 9.5: Search Service API

**Cursor Prompt**:
```
Implement search-service REST API (internal):
- POST /search/index - manually trigger indexing
- GET /search/status - get indexing status
- POST /search/reindex - reindex all content
- Add Swagger documentation
```

### Step 9.6: Search Service Tests

**Cursor Prompt**:
```
Write tests for search-service:
- Unit tests for SearchService
- Integration tests for Kafka consumer
- Test indexing and search functionality
- Test event processing
```

**Validation**:
- [x] Search service starts and connects to Kafka
- [ ] Consumes Kafka events correctly
- [ ] Updates search index on events
- [ ] Can search indexed content
- [x] Tests pass

---

## Milestone 10: CMS Gateway

**Objective**: Build the CMS Gateway with authentication, RBAC, rate limiting, and routing to CMS services.

**Prerequisites**: Milestone 2, 3, 4, 5, 6, 8 complete

**Estimated Time**: 5-6 days

### Step 10.1: CMS Gateway Setup

**Cursor Prompt**:
```
Create api-gateway-cms in services/api-gateway-cms/:
- NestJS application structure
- Port 8081
- Install @nestjs/microservices for service communication
- Install @nestjs/throttler for rate limiting
- Install @nestjs/swagger for API documentation
```

### Step 10.2: Authentication & Authorization

**Cursor Prompt**:
```
Implement authentication in CMS Gateway:
- JWT validation using shared JwtAuthGuard
- RBAC using shared RolesGuard (ADMIN, EDITOR roles)
- @Public() decorator for public endpoints
- @Roles() decorator for role-based access
- Token validation at gateway level
```

### Step 10.3: API Versioning

**Cursor Prompt**:
```
Implement API versioning in CMS Gateway:
- URL-based versioning: /api/v1/...
- Version controller decorator
- Support for multiple versions (v1, v2 in future)
- Version routing middleware
```

### Step 10.4: Service Routing

**Cursor Prompt**:
```
Implement service routing in CMS Gateway:
- Route to CMS Service: /api/v1/cms/programs, /api/v1/cms/episodes
- Route to Metadata Service: /api/v1/metadata/...
- Route to Media Service: /api/v1/media/...
- Route to Ingest Service: /api/v1/ingest/...
- Use HTTP client or microservice transport
- Implement service discovery or direct connection
```

### Step 10.5: Rate Limiting

**Cursor Prompt**:
```
Implement Redis-based rate limiting in CMS Gateway:
- Use @nestjs/throttler with Redis storage
- Apply to write-heavy endpoints (POST, PUT, DELETE)
- Different limits for ADMIN vs EDITOR
- Rate limit by user ID
- Configure limits (e.g., 100 requests/minute for admins, 50 for editors)
```

### Step 10.6: Resilience Patterns

**Cursor Prompt**:
```
Implement resilience patterns in CMS Gateway:
- Retry interceptor for downstream service calls (exponential backoff)
- Circuit breaker for service calls
- Timeout configuration
- Use shared resilience utilities
- Handle service failures gracefully
```

### Step 10.7: API Documentation

**Cursor Prompt**:
```
Add Swagger/OpenAPI documentation to CMS Gateway:
- Configure Swagger module
- Document all endpoints with DTOs
- Add authentication to Swagger UI
- Generate Postman collection
- Include examples and descriptions
```

### Step 10.8: CMS Gateway Tests

**Cursor Prompt**:
```
Write tests for CMS Gateway:
- Unit tests for controllers and guards
- Integration tests for routing
- Test authentication and authorization
- Test rate limiting
- Test resilience patterns
```

**Validation**:
- [x] CMS Gateway starts on port 8081
- [ ] JWT authentication works
- [ ] RBAC enforcement works
- [ ] Routes to services correctly
- [ ] Rate limiting works
- [ ] Circuit breaker and retries work
- [ ] Swagger docs are accessible
- [x] Tests pass

---

## Milestone 11: Discovery Gateway

**Objective**: Build the Discovery Gateway with public APIs, GraphQL support, and rate limiting.

**Prerequisites**: Milestone 2, 3, 7, 9 complete

**Estimated Time**: 6-7 days

### Step 11.1: Discovery Gateway Setup

**Cursor Prompt**:
```
Create api-gateway-discovery in services/api-gateway-discovery/:
- NestJS application structure
- Port 8080
- Install @nestjs/graphql for GraphQL support
- Install @nestjs/throttler for rate limiting
- Install @nestjs/swagger for API documentation
```

### Step 11.2: REST API Routing

**Cursor Prompt**:
```
Implement REST API routing in Discovery Gateway:
- Route to Discovery Service: /api/v1/discovery/...
- Route to Search Service: /api/v1/search/...
- Public endpoints (no auth required by default)
- Optional JWT validation for personalized features
- API versioning: /api/v1/...
```

### Step 11.3: GraphQL API

**Cursor Prompt**:
```
Implement GraphQL API in Discovery Gateway:
- GraphQL schema for programs, episodes, search
- Resolvers for queries: programs, program, episodes, search, trending, popular
- Support for filtering, pagination, sorting
- GraphQL playground endpoint
- Use @nestjs/graphql with code-first approach
```

### Step 11.4: Rate Limiting

**Cursor Prompt**:
```
Implement Redis-based rate limiting in Discovery Gateway:
- Apply to search endpoints (expensive operations)
- Rate limit by IP address for public endpoints
- Rate limit by user ID for authenticated endpoints
- Configure limits (e.g., 60 requests/minute for search)
- Use @nestjs/throttler with Redis storage
```

### Step 11.5: Resilience Patterns

**Cursor Prompt**:
```
Implement resilience patterns in Discovery Gateway:
- Retry interceptor for downstream calls
- Circuit breaker for service calls
- Timeout configuration
- Use shared resilience utilities
- Handle service failures gracefully
```

### Step 11.6: API Documentation

**Cursor Prompt**:
```
Add API documentation to Discovery Gateway:
- Swagger/OpenAPI for REST endpoints
- GraphQL playground for GraphQL
- Generate Postman collection
- Document rate limits and authentication
```

### Step 11.7: Discovery Gateway Tests

**Cursor Prompt**:
```
Write tests for Discovery Gateway:
- Unit tests for controllers and resolvers
- Integration tests for REST and GraphQL
- Test rate limiting
- Test resilience patterns
- Test public vs authenticated endpoints
```

**Validation**:
- [ ] Discovery Gateway starts on port 8080
- [ ] REST API works
- [ ] GraphQL API works
- [ ] Rate limiting works
- [ ] Circuit breaker and retries work
- [ ] Swagger and GraphQL playground accessible
- [ ] Tests pass

---

## Milestone 12: Docker & Deployment

**Objective**: Containerize all services and set up Docker Compose for full stack deployment.

**Prerequisites**: All previous milestones complete

**Estimated Time**: 3-4 days

### Step 12.1: Dockerfiles

**Cursor Prompt**:
```
Create Dockerfile for each service:
- Multi-stage builds (build stage, production stage)
- Use Node.js 20 Alpine base image
- Copy package files and install dependencies
- Copy source code and build
- Expose service ports
- Set up health checks
- Optimize for production (small image size)
```

### Step 12.2: Docker Compose Services

**Cursor Prompt**:
```
Update compose.yml to include all services:
- All microservices (gateways and services)
- Database services (already configured)
- Redis (already configured)
- Kafka (already configured)
- Configure service dependencies and startup order
- Set up networks and environment variables
- Add health checks
```

### Step 12.3: Environment Configuration

**Cursor Prompt**:
```
Create environment configuration:
- .env.example with all required variables
- Environment-specific configs (.env.development, .env.production)
- Database connection strings
- JWT secrets
- Redis connection
- Kafka connection
- Object storage credentials
- Service ports and URLs
```

### Step 12.4: Health Checks

**Cursor Prompt**:
```
Implement health checks for all services:
- GET /health endpoint in each service
- Check database connectivity
- Check Redis connectivity
- Check Kafka connectivity
- Return service status and dependencies status
- Use @nestjs/terminus for health checks
```

### Step 12.5: PM2 Configuration Update

**Cursor Prompt**:
```
Update ecosystem.config.js for production:
- Configure all services with proper environment variables
- Set up log rotation
- Configure cluster mode for gateways (optional)
- Set up process monitoring
- Configure auto-restart policies
```

### Step 12.6: Deployment Documentation

**Cursor Prompt**:
```
Create deployment documentation:
- Docker Compose deployment instructions
- PM2 deployment instructions
- Environment variable reference
- Health check endpoints
- Troubleshooting guide
- Update README with deployment section
```

### Step 12.7: AWS Infrastructure Setup

**Cursor Prompt**:
```
Set up AWS infrastructure for MediaMesh:
- Create VPC with public and private subnets
- Create security groups for ALB, ECS/EKS, RDS, ElastiCache
- Set up RDS PostgreSQL instances for each service (multi-AZ)
- Create DynamoDB tables: discovery-hot-data, search-index, rate-limits
- Set up ElastiCache Redis cluster
- Create MSK Kafka cluster
- Create S3 buckets for media assets
- Set up CloudFront distribution
- Create Application Load Balancer (ALB)
- Configure IAM roles and policies
- Store secrets in AWS Secrets Manager
```

### Step 12.8: DynamoDB Integration

**Cursor Prompt**:
```
Integrate DynamoDB into Discovery and Search services:
- Install AWS SDK (@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb)
- Create DynamoDB service in shared module
- Update Discovery Service to use DynamoDB for hot data (popular programs, trending)
- Update Search Service to use DynamoDB for search indexes
- Implement cache-aside pattern (DynamoDB → PostgreSQL fallback)
- Add TTL to DynamoDB items for automatic expiration
- Configure IAM roles for DynamoDB access
- Test DynamoDB integration locally with DynamoDB Local
```

**Validation**:
- [ ] All services have Dockerfiles
- [ ] Docker Compose starts all services
- [ ] All services are healthy
- [ ] Services can communicate
- [ ] Environment variables are configured
- [ ] Health checks work
- [ ] AWS infrastructure is set up
- [ ] DynamoDB tables are created and accessible
- [ ] Services can read/write to DynamoDB
- [ ] Documentation is complete

---

## Milestone 13: Testing & Documentation

**Objective**: Comprehensive testing suite and complete API documentation.

**Prerequisites**: All previous milestones complete

**Estimated Time**: 4-5 days

### Step 13.1: E2E Tests

**Cursor Prompt**:
```
Create end-to-end tests:
- E2E test suite for each gateway
- Test complete user flows (register, login, create content, search)
- Test service interactions
- Test error scenarios
- Use Jest and Supertest
- Set up test database and infrastructure
```

### Step 13.2: Integration Tests

**Cursor Prompt**:
```
Enhance integration tests:
- Test service-to-service communication
- Test Kafka event flow
- Test Redis caching
- Test database operations
- Mock external dependencies
```

### Step 13.3: API Documentation

**Cursor Prompt**:
```
Complete API documentation:
- Ensure all endpoints are documented in Swagger
- Add detailed descriptions and examples
- Document error responses
- Generate and update Postman collection
- Include authentication instructions
- Document rate limits
```

### Step 13.4: Code Coverage

**Cursor Prompt**:
```
Set up code coverage:
- Configure Jest coverage
- Aim for 80%+ coverage
- Identify and test uncovered code paths
- Generate coverage reports
- Add coverage to CI/CD (if applicable)
```

### Step 13.5: Performance Tests

**Cursor Prompt**:
```
Create performance tests:
- Load tests for critical endpoints
- Test rate limiting under load
- Test caching effectiveness
- Test service resilience under failure
- Use tools like k6 or Artillery
```

**Validation**:
- [ ] E2E tests pass
- [ ] Integration tests pass
- [ ] Code coverage meets target
- [ ] API documentation is complete
- [ ] Postman collection is updated
- [ ] Performance tests pass

---

## Milestone 14: Observability & Monitoring

**Objective**: Implement comprehensive observability with structured logging, metrics, and distributed tracing.

**Prerequisites**: All previous milestones complete

**Estimated Time**: 3-4 days

### Step 14.1: Structured Logging

**Cursor Prompt**:
```
Enhance logging across all services:
- Use structured JSON logging (winston or pino)
- Include correlation IDs in all logs
- Include trace IDs in all logs
- Log request/response for API calls
- Log Kafka events
- Configure log levels
- Set up log aggregation (PM2 logs or external)
```

### Step 14.2: Metrics Collection

**Cursor Prompt**:
```
Implement metrics collection:
- Request count, latency, error rate per endpoint
- Kafka consumer lag metrics
- Database query metrics
- Cache hit/miss rates
- Circuit breaker status
- Expose metrics endpoint (/metrics) in each service
- Use Prometheus format (optional)
```

### Step 14.3: Distributed Tracing

**Cursor Prompt**:
```
Implement distributed tracing:
- Generate trace IDs at gateway level
- Propagate trace IDs across services
- Include trace IDs in Kafka events
- Log trace IDs in all log entries
- Support OpenTelemetry (optional, for future)
```

### Step 14.4: Error Tracking

**Cursor Prompt**:
```
Implement error tracking:
- Centralized error logging
- Error aggregation and reporting
- Stack trace logging
- Error context (user ID, request ID, etc.)
- Optional: Integrate with error tracking service (Sentry, etc.)
```

### Step 14.5: Monitoring Dashboard

**Cursor Prompt**:
```
Create monitoring setup:
- PM2 monitoring (built-in)
- Optional: Prometheus + Grafana setup
- Health check monitoring
- Service status dashboard
- Document monitoring setup
```

**Validation**:
- [ ] All services have structured logging
- [ ] Correlation and trace IDs are propagated
- [ ] Metrics are collected
- [ ] Distributed tracing works
- [ ] Error tracking works
- [ ] Monitoring dashboard is accessible

---

## Quick Reference: Cursor Prompts

### Infrastructure Setup
```
Set up [service] with NestJS, TypeORM/Prisma, database connection to [db_name], and basic CRUD endpoints.
```

### Service Communication
```
Implement HTTP client/microservice communication from [gateway] to [service] with retry and circuit breaker.
```

### Kafka Integration
```
Add Kafka producer/consumer to [service] to emit/consume [event_type] events using shared event schemas.
```

### Authentication
```
Implement JWT authentication in [gateway] using shared JwtAuthGuard and validate tokens from auth-service.
```

### Authorization
```
Add RBAC to [endpoint] requiring [ROLE] using shared RolesGuard and @Roles() decorator.
```

### Caching
```
Implement Redis caching in [service] for [endpoint] with [TTL] using cache-aside pattern.
```

### Rate Limiting
```
Add Redis-based rate limiting to [endpoint] with [limit] requests per [timeframe] using @nestjs/throttler.
```

### API Documentation
```
Add Swagger/OpenAPI documentation to [service] with all endpoints, DTOs, and authentication.
```

### Testing
```
Write unit and integration tests for [service] covering [scenarios] using Jest and Supertest.
```

### Docker
```
Create Dockerfile for [service] with multi-stage build, health checks, and production optimizations.
```

---

## Development Tips

1. **Start Small**: Build one service at a time, test it, then move to the next
2. **Use Shared Module**: Always use shared DTOs, guards, and utilities
3. **Test Early**: Write tests as you build, not after
4. **Document as You Go**: Keep Swagger docs updated
5. **Incremental Integration**: Test service communication early
6. **Monitor Logs**: Use PM2 logs to debug issues
7. **Version Control**: Commit after each milestone

---

## Estimated Timeline Summary

| Milestone               | Duration | Cumulative |
| ----------------------- | -------- | ---------- |
| 1. Foundation           | 2-3 days | 2-3 days   |
| 2. Shared Module        | 5-7 days | 7-10 days  |
| 3. Auth Service         | 4-5 days | 11-15 days |
| 4. CMS Service          | 5-6 days | 16-21 days |
| 5. Metadata Service     | 3-4 days | 19-25 days |
| 6. Media Service        | 4-5 days | 23-30 days |
| 7. Discovery Service    | 4-5 days | 27-35 days |
| 8. Ingest Service       | 5-6 days | 32-41 days |
| 9. Search Service       | 4-5 days | 36-46 days |
| 10. CMS Gateway         | 5-6 days | 41-52 days |
| 11. Discovery Gateway   | 6-7 days | 47-59 days |
| 12. Docker & Deployment | 3-4 days | 50-63 days |
| 13. Testing & Docs      | 4-5 days | 54-68 days |
| 14. Observability       | 3-4 days | 57-72 days |

**Total Estimated Time**: 8-12 weeks (depending on team size and complexity)

---

## Scalability Considerations

While building MediaMesh, keep scalability in mind from the start:

- **Design for Scale**: Use stateless services, horizontal scaling patterns
- **Caching Early**: Implement Redis caching from the beginning
- **Database Optimization**: Add indexes and optimize queries early
- **Monitoring**: Set up metrics and monitoring as you build
- **Design Patterns**: Consider CQRS for read/write separation (see [Design Patterns Guide](./DESIGN_PATTERNS_GUIDE.md))

For detailed scalability strategies to achieve **10M users/hour**, see the [Scalability Guide](./SCALABILITY_GUIDE.md).

---

## Next Steps

1. Review this plan and adjust based on your priorities
2. Start with Milestone 1
3. Use the Cursor prompts provided for each step
4. Validate each milestone before moving to the next
5. Update this document as you progress
6. Refer to the Scalability Guide when planning for production scale

Good luck building MediaMesh! 🚀
