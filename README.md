# MediaMesh Platform (CMS + Discovery Microservices)

A modern, scalable media platform built with **NestJS microservices architecture**, featuring **API versioning**, **resilience patterns (circuit breaker & retry)**, **event-driven architecture with Kafka**, **Redis caching + rate limiting**, **stateless JWT authentication**, **RBAC authorization**, **REST + GraphQL APIs**, **PM2 process management**, and **comprehensive API documentation**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Design Decisions](#design-decisions)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Recent Updates](#recent-updates)
- [Future Enhancements & TODOs](#future-enhancements--todos)

---

## 🎯 Overview

MediaMesh is a multi-service NestJS platform that provides:

- **CMS (Content Management System)**: Internal tools for editors/admins to create and manage programs and episodes.
- **Discovery**: Public APIs for users to search and browse programs/episodes efficiently.

The system is built to be **cloud-native**, **secure**, **resilient**, **observable**, and ready to support **future ingestion from multiple sources** (e.g., YouTube, RSS, external APIs).

### Key Features

- **Microservices Architecture**: Independent services for CMS, Discovery, Metadata, Media, Ingest, Search, and Auth
- **Gateway Microservices Pattern**: Each client app has its own gateway and security layer
- **API Versioning**: URL-based versioning (`/api/v1/...`) with backward compatibility strategy
- **Stateless JWT Authentication**: Token-based authentication without server-side sessions
- **Role-Based Access Control (RBAC)**: Role-based authorization (ADMIN, EDITOR, USER)
- **Resilience Patterns**: Circuit breaker and retry mechanisms for inter-service communication
- **Event-Driven Architecture**: Kafka-based event streaming for service communication and indexing workflows
- **Redis Caching**: Hot-read caching for discovery/search and shared caching utilities
- **Rate Limiting**: Redis-backed distributed rate limiting for critical endpoints
- **RESTful APIs + GraphQL**: Both API styles supported per gateway use-case
- **API Documentation**: Swagger/OpenAPI + Postman collection for testing and collaboration
- **Database Migrations**: Version-controlled schema management per service
- **Docker Support**: Full containerization with Docker Compose
- **Comprehensive Testing**: Unit, integration, and e2e testing strategy
- **Observability**: Structured logs, metrics, and distributed tracing (trace/correlation IDs)
- **Performance**: Cache + CDN support for fast content delivery
- **Scalability Goal**: Designed to scale horizontally to support up to **10M users/hour**
- **Engineering Principles**: SOLID, low coupling, clear module/service boundaries

---

## 🏗️ Architecture

### System Architecture
```
┌────────────────────────────────┐                                                     
│  Discovery Gateway (Public)    │
│ (Port 8080)                    │
└──────────────┬─────────────────┘
               │
               │
┌──────────────▼───────────────┐
│   Discovery Service          │
│   (Port 8090)                │
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│   discovery_db               │
│   (e.g., Postgres)           │
└──────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                           CMS Gateway (Internal)                     │
│  (Port 8081)                                                         │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────────┐
          │                      │                          │
┌─────────▼──────────┐  ┌────────▼─────────┐       ┌────────▼──────────┐
│ CMS Service        │  │ Metadata Service │       │ Media Service     │
│ (Programs/Episodes)│  │ (Metadata Mgmt)  │       │ (Assets/CDN links)│
│ :8082              │  │ :8083            │       │ :8084             │
└─────────┬──────────┘  └────────┬─────────┘       └────────┬──────────┘
          │                      │                          │
┌─────────▼─────────┐    ┌───────▼─────────┐       ┌────────▼──────────┐
│ cms_db            │    │ metadata_db     │       │ media_db          │
│ (Postgres)        │    │ (Postgres)      │       │ + Object Storage  │
└───────────────────┘    └─────────────────┘       │ (S3/Spaces/MinIO) │
                                                   └───────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              Shared Infrastructure                       │
└──────────────────────────────────────────────────────────────────────────┘
    ┌───────────────────┐          ┌────────────────────────┐
    │ Redis             │          │ Kafka Broker           │
    │ - Cache           │          │ - content.events       │
    │ - Rate Limiting   │          │ - ingest.events        │
    │ - Idempotency     │          │ - discovery.events     │
    └─────────┬─────────┘          └─────────────┬──────────┘
              │                                  │
              │                                  │
    ┌─────────▼──────────┐          ┌─────────────▼──────────┐
    │ Observability      │          │ Resilience Layer       │
    │ - Logs (PM2 + JSON)│          │ - Retries (backoff)    │
    │ - Metrics          │          │ - Circuit Breaker      │
    │ - Tracing          │          │ - Timeouts             │
    └────────────────────┘          └────────────────────────┘
```

---

### Service Responsibilities

#### Discovery Gateway (Port 8080)
- **Purpose**: Public entry point for end-user apps (Discovery clients)
- **Responsibilities**:
  - Request routing to Discovery/Search services
  - JWT validation (when applicable)
  - RBAC enforcement for protected endpoints
  - API versioning (`/api/v1/...`)
  - Rate limiting for critical/public endpoints (Redis)
  - REST + GraphQL API exposure
  - Swagger/OpenAPI docs + Postman collection
  - Resilience (timeouts, retry, circuit breaker)

#### CMS Gateway (Port 8081)
- **Purpose**: Internal entry point for CMS admins/editors
- **Responsibilities**:
  - JWT validation and RBAC (ADMIN/EDITOR)
  - Routing to CMS/Metadata/Media/Ingest
  - Rate limiting for write-heavy endpoints (Redis)
  - API versioning and documentation
  - Resilience (timeouts, retry, circuit breaker)

#### Auth Service (Port 8086)
- **Purpose**: Authentication and authorization support
- **Responsibilities**:
  - User login and token issuance (JWT)
  - Role management (ADMIN, EDITOR, USER)
  - Password hashing/verification
  - Optional token configuration and expiration policies
  - Publishes auth/user lifecycle events (Kafka)
  - Database: `auth_db`

#### CMS Service (Port 8082)
- **Purpose**: Program/Episode management (internal)
- **Responsibilities**:
  - CRUD for programs and episodes
  - Publishing workflow (draft/published)
  - Emits events (`content.created`, `content.updated`, `content.published`)
  - Database: `cms_db`

#### Metadata Service (Port 8083)
- **Purpose**: Metadata ownership and validation
- **Responsibilities**:
  - Stores/validates metadata (title, description, category, language, duration, publish date)
  - Ensures consistent schema and versioning
  - Database: `metadata_db`

#### Media Service (Port 8084)
- **Purpose**: Media assets management
- **Responsibilities**:
  - Handles thumbnails, assets, and storage references
  - Integrates with Object Storage and CDN
  - Database: `media_db` + Object Storage (S3/Spaces/MinIO)

#### Ingest Service (Port 8085)
- **Purpose**: Import content from external sources
- **Responsibilities**:
  - Connects to external sources (YouTube/RSS/APIs)
  - Normalizes imported data into internal models
  - Emits ingest events (`ingest.completed`, `ingest.failed`)
  - Database: `ingest_db`

#### Search/Indexing Service (Port 8091)
- **Purpose**: Builds/updates the search index
- **Responsibilities**:
  - Consumes Kafka events and updates search indexes
  - Supports fast queries for Discovery
  - Database: `search_db` and/or Search Engine (OpenSearch/Elasticsearch)

### Shared Module

The `shared` module contains:
- **DTOs & Contracts**: Shared schemas for requests/responses and inter-service payloads
- **Kafka Events**: Event types, versioning, and serializers
- **Guards & Decorators**: RBAC helpers, JWT utilities, request context decorators
- **Resilience Utilities**: retry/backoff and circuit breaker wrappers/interceptors
- **Observability Utilities**: correlation/trace ID propagation, structured log helpers
- **Common Tools**: errors, constants, pagination helpers, validation utilities

---

## 🎨 Design Decisions

### 1. Microservices Architecture

**Decision**: Separate services for CMS, Metadata, Media, Ingest, Discovery, Search, and Auth.

**Rationale**:
- **Scalability**: Each service scales independently based on load (e.g., Discovery vs CMS)
- **Fault Isolation**: Issues in one service do not bring down the whole system
- **Maintainability**: Smaller, focused codebases per service
- **Team Autonomy**: Clear ownership and bounded context per service

### 2. Gateway Microservices Pattern

**Decision**: One gateway per client type (CMS Gateway, Discovery Gateway).

**Rationale**:
- **Centralized Security**: Auth, RBAC, and rate limiting in one place per client
- **API Clarity**: Each gateway exposes APIs tailored to its client needs
- **Isolation**: CMS internal APIs are separated from public Discovery traffic
- **Easier Evolution**: Public and internal APIs can evolve independently

### 3. Stateless JWT Authentication

**Decision**: Stateless JWT authentication (no server-side sessions).

**Rationale**:
- **Horizontal Scaling**: Works naturally across multiple instances
- **Performance**: Token validation is cryptographic (no session store required)
- **Microservices Friendly**: Gateways/services can validate tokens consistently
- **Simplicity**: Fewer moving parts and easier deployment

### 4. Role-Based Access Control (RBAC)

**Decision**: Role-based access control with well-defined roles (ADMIN, EDITOR, USER).

**Rationale**:
- **Least Privilege**: Users only access what they need
- **Clear Separation**: CMS roles (ADMIN/EDITOR) vs Discovery users (USER)
- **Extensible**: Easy to add new roles and permissions later

### 5. Database per Service

**Decision**: Each microservice owns its database.

**Rationale**:
- **Data Isolation**: Services do not directly access each other’s schema
- **Independent Deployment**: Schema changes don’t break other services
- **Scaling**: Different databases can scale independently
- **Flexibility**: Each service can choose the best persistence approach

### 6. API Versioning

**Decision**: URL-based API versioning with backward compatibility.

**Rationale**:
- **Future-Proof**: Allows evolution without breaking existing clients
- **Migration Path**: Clients upgrade at their own pace
- **Clarity**: `/api/v1/...` is explicit and easy to manage

**Example**:
- GET /api/v1/discovery/search
- POST /api/v1/cms/programs

### 7. REST + GraphQL + Documentation

**Decision**: Support REST and GraphQL, plus full documentation.

**Rationale**:
- **REST**: Great for standard CRUD and caching-friendly endpoints
- **GraphQL**: Great for flexible discovery queries and avoiding over/under-fetching
- **Swagger/OpenAPI**: Clear contract and interactive docs for REST
- **Postman Collection**: Easy testing, sharing, and environment management

### 8. Resilience Patterns (Circuit Breaker & Retry)

**Decision**: Use circuit breaker + retry (with backoff) for downstream calls.

**Rationale**:
- **Fault Tolerance**: Avoid cascading failures
- **Stability**: Fail fast when dependency is unhealthy
- **Better UX**: Retries handle transient network/service issues
- **Operational Safety**: Prevent overload on already failing services

### 9. Event-Driven Architecture with Kafka

**Decision**: Kafka for async event-driven communication.

**Rationale**:
- **Decoupling**: Services communicate via events instead of tight coupling
- **Scalability**: Consumers scale horizontally with consumer groups
- **Reliability**: Durable event log supports replay and auditing
- **Search Indexing**: Index updates are triggered asynchronously

**Example Events**:
- `content.created`, `content.updated`, `content.published`
- `ingest.completed`, `ingest.failed`
- `search.index.requested`

### 10. Redis Caching Strategy

**Decision**: Cache-aside pattern with TTL, primarily for hot reads in Discovery.

**Rationale**:
- **Performance**: Fast reads for frequently accessed data
- **Reduced DB Load**: Minimizes repeated database queries
- **Scalable**: Shared cache across multiple instances

### 11. Rate Limiting

**Decision**: Redis-based distributed rate limiting for critical APIs.

**Rationale**:
- **Security**: Protect auth endpoints from brute-force attempts
- **Stability**: Prevent traffic spikes from exhausting resources
- **Distributed**: Works across multiple gateway instances

**Typical targets**:
- `POST /auth/login`
- CMS write-heavy endpoints (publish/update)
- High-cost discovery search endpoints

### 12. Observability (Logs, Metrics, Tracing)

**Decision**: First-class observability built into gateways and services.

**Rationale**:
- **Logs**: Structured logs (JSON) with correlation IDs for debugging
- **Metrics**: Request count/latency/error rate and Kafka consumer lag
- **Tracing**: Trace IDs propagated across services and Kafka messages

### 13. PM2 Process Management

**Decision**: Use PM2 to run and manage Node/NestJS services.

**Rationale**:
- **Operational Control**: Start/stop/restart each service easily
- **Stability**: Auto-restart on crash
- **Logs**: Centralized log management per service process
- **Monitoring**: Basic process monitoring and reload support

### 14. Scalability Target (Up to 10M users/hour)

**Decision**: Scale horizontally with strong caching, async pipelines, and isolation.

**Rationale**:
- **Gateways scale out** behind a load balancer
- **Discovery/Search scale out** with cache + async indexing
- **Kafka absorbs spikes** and smooths processing load
- **DB per service** prevents cross-service bottlenecks
- **CDN reduces origin load** for media assets

---

## 📦 Prerequisites

### Required Software

- **Node.js 20+** (or 18+ LTS)
- **pnpm / npm / yarn** (choose one)
- **Docker** and **Docker Compose**
- **PostgreSQL 16+** (if running locally)
- **Redis 7+** (if running locally)
- **Kafka** (Docker recommended)
- **PM2** (global install for local process management)
  ```bash
  npm i -g pm2
  ```

### Optional Tools
- Postman for API testing
- Kafka UI for topic monitoring
- pgAdmin / TablePlus for database management

---
## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# Clone repository
git clone <repository-url>
cd mediamesh

# Start infrastructure + services
docker compose up -d

# Check status
docker compose ps

# Follow gateway logs (example)
docker compose logs -f discovery-gateway
```

Services (example):
- Discovery Gateway: http://localhost:8080
- CMS Gateway: http://localhost:8081
- Swagger: http://localhost:8080/docs  (or /api/docs depending on your setup)
- Kafka UI: http://localhost:8090 (if enabled)

### Option 2: Local Development with PM2
```bash
# Step 1: Start Infrastructure
docker compose up -d postgres redis kafka


# Step 2: Install Dependencies
npm install


# Step 3: Build
npm run build

# Step 4: Start Services with PM2
pm2 start ecosystem.config.js
pm2 status
pm2 logs
```
---

## 💻 Development

### Project Structure
```
root
├── services
│   ├── api-gateway-cms
│   ├── api-gateway-discovery
│   ├── auth-service
│   ├── cms-service
│   ├── metadata-service
│   ├── media-service
│   ├── ingest-service
│   ├── discovery-service
│   └── search-service
├── shared
│   ├── dto
│   ├── events
│   ├── utils
│   ├── constants
│   ├── guards
│   ├── resilience
│   └── observability
├── package.json
└── README.md
```

### Development Workflow
1. Create a feature branch
1. Implement changes with SOLID and clear module boundaries
1. Add/extend tests
1. Update Swagger docs + Postman collection if APIs change
1. Run test suite before merging

---
## 🚢 Deployment
### Docker Deployment
```bash
docker compose build
docker compose up -d
```

### Production Considerations
1. Use strong secrets for JWT and DB credentials
1. Run gateways behind a load balancer (scale horizontally)
1. Use managed Postgres/Redis/Kafka where possible
1. Enable CDN for media assets
1. Centralize logs + metrics + traces
1. Configure health checks and readiness probes

---

## 🧩 Technology Stack

- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Architecture:** Microservices
- **Inter-service Communication:** Kafka (event-driven)
- **API Pattern:** Gateway Microservices Pattern
- **Authentication:** JWT (JSON Web Tokens)
- **Authorization:** Role-Based Access Control (RBAC)
- **Caching:** Redis / in-memory cache
- **Rate Limiting:** Redis-backed distributed rate limiter
- **Content Delivery:** CDN
- **Process Manager:** PM2

---

## 🔐 Security Design

### Authentication
- JWT-based authentication
- Stateless token validation
- Tokens validated at the gateway layer

### Authorization
- Role-based access control (RBAC)
- Example roles:
  - `ADMIN`
  - `EDITOR`
  - `USER`
- Authorization enforced at both gateway and service levels

---

## 🌐 Gateway Microservices Pattern

Each client-facing application communicates through its own dedicated API Gateway.

### Gateways Responsibilities
- Authentication and authorization
- Request validation
- API routing to internal services
- Security isolation per client

### Examples
- CMS Admin Gateway
- Public Discovery Gateway

This pattern allows each client application to evolve independently while maintaining strong security boundaries.

---

## 🔄 Event-Driven Communication (Kafka)

Kafka is used for asynchronous communication between services.

### Example Events
- `content.created`
- `content.updated`
- `content.published`
- `ingest.completed`

### Benefits
- Loose coupling between services
- High scalability
- Reliable message delivery
- Better fault tolerance

---
## 🚦 Rate Limiting (Redis-backed)

MediaMesh protects critical APIs using **distributed rate limiting** backed by **Redis**.

### Why Redis?
In a microservices / cloud environment, multiple gateway instances may run in parallel.  
Redis provides a shared, centralized store so rate limits remain consistent across all instances.

### Where Rate Limiting Is Applied
Rate limiting is enforced primarily at the **API Gateway layer**, because:
- It blocks abusive traffic early (before hitting internal services)
- It reduces load and protects downstream dependencies
- It keeps rules client-specific (CMS vs Discovery)

### Suitable Rate Limiting Approach
A token-bucket / sliding-window style strategy is used to:
- Allow short bursts
- Enforce steady limits over time
- Provide fairness across users

### Example Use Cases (Critical APIs)
- Authentication endpoints (login, token refresh)
- CMS write operations (create/update/publish content)
- Expensive discovery operations (search endpoints)

### Limiting Dimensions
Depending on the endpoint, limits can be applied by:
- **User ID** (authenticated users)
- **IP address** (unauthenticated or public endpoints)
- **Client type** (CMS vs Discovery)

### Benefits
- Prevents brute-force attempts and abuse
- Protects system availability
- Reduces infrastructure costs
- Improves overall platform stability

---

## 🛡 Resilience & Fault Tolerance

MediaMesh is designed to be **resilient to failures** in a distributed system environment.

### Retries
- Temporary failures between services are handled using controlled retries
- Retry mechanisms are applied with limits and backoff strategies
- Prevents failures caused by transient network or service issues

### Circuit Breaker
- Circuit breakers are used to prevent cascading failures
- If a downstream service becomes unavailable:
  - Calls are stopped temporarily
  - The system fails fast instead of overwhelming the failing service
- Services automatically recover once the downstream service becomes healthy again

### Why This Matters
- Improves system stability
- Prevents total system outages
- Ensures better user experience even during partial failures

---

## 🔍 Observability (Logs, Metrics, Tracing)

Observability is a core design goal in MediaMesh to ensure system health, performance visibility, and fast issue diagnosis in a distributed environment.

### 📄 Logging
- Each microservice produces structured logs
- Logs include:
  - Request identifiers
  - Service name
  - Timestamp
  - Log level (info, warning, error)
- PM2 is used to:
  - Aggregate logs per service
  - View logs in real time
  - Persist logs for troubleshooting

**Purpose:**
- Debug errors
- Trace user requests
- Investigate service failures

### 📊 Metrics
- Each service exposes basic operational metrics, such as:
  - Request count
  - Response time
  - Error rate
  - Kafka consumer lag
- Metrics allow monitoring of:
  - Service health
  - System performance
  - Resource usage

**Purpose:**
- Detect performance degradation
- Monitor traffic and load
- Support scaling decisions

### 🧵 Distributed Tracing
- Each incoming request is assigned a unique **trace identifier**
- The trace ID is propagated across:
  - API gateways
  - Internal services
  - Kafka events
- This enables tracking a single request across multiple services

**Purpose:**
- Understand request flow end-to-end
- Identify bottlenecks
- Diagnose latency issues in distributed systems

### Why Observability Matters
- Faster debugging and incident resolution
- Better understanding of system behavior
- Increased reliability and confidence in production
- Essential for microservices-based systems

---

## 📦 Shared Module

The `shared` module contains reusable components used across all services:

- DTOs and interfaces
- Kafka event schemas
- Utility functions
- Common constants
- Guards and decorators
- Resilience and observability utilities

This ensures consistent behavior and reduces duplicated logic.

---

## ⚙️ Service Management with PM2

PM2 is used as the **process manager** for running and managing all microservices.

### PM2 Responsibilities
- Start and stop services
- Automatically restart failed services
- Centralized logging per service
- Process monitoring and stability

PM2 helps keep MediaMesh services running reliably in both development and production environments.

---

## ⚡ Performance Optimization

### Caching
- Frequently accessed data cached to reduce database load
- Improves response time for discovery and search operations

### CDN
- Static assets and media files served via CDN
- Reduces latency
- Improves global content delivery


---

## 🚀 Future Enhancements & TODOs

### High Priority

1. Event Outbox Pattern (Consistency Guarantee)
    - Add outbox table per service for guaranteed event publishing
    - Ensure business transaction + event persistence are atomic
    - Add outbox worker / CDC integration

2. Full Search Engine Integration
    - Integrate OpenSearch/Elasticsearch for production-grade search
    - Add analyzers for Arabic/English text and advanced ranking

3. Advanced Observability
    - OpenTelemetry end-to-end tracing visualization
    - Prometheus + Grafana dashboards
    - Alerting for errors, latency, circuit breaker status, and consumer lag

### Medium Priority

4. Recommendation & Personalization
    - Trending, popular, and recommended content
    - Personalized feed (optional auth)

5. Advanced Caching
    - Event-driven cache invalidation
    - Cache warming and multi-layer caching strategies

6. Security Enhancements
    - OAuth2/OIDC integration (optional)
    - API key management for external ingestion sources
    - Fine-grained permissions (scopes/claims)

### Low Priority

7. API v2 Planning
    - Introduce breaking changes safely via /api/v2/...
    - Deprecation roadmap and migration guide

---

Built with ❤️ using NestJS, Kafka, Redis, Docker, PM2, and modern microservices patterns.