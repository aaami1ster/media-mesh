# MediaMesh Platform (CMS + Discovery Microservices)

A modern, scalable media platform built with **NestJS microservices architecture**, featuring **API versioning**, **resilience patterns (circuit breaker & retry)**, **event-driven architecture with Kafka**, **Redis caching + rate limiting**, **stateless JWT authentication**, **RBAC authorization**, **REST + GraphQL APIs**, **PM2 process management**, and **comprehensive API documentation**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Design Decisions](#design-decisions)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [Technology Stack](#technology-stack)
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
- **API Versioning**: URL-based versioning (`/api/v1/...`) with backward compatibility
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
    ┌─────────▼──────────┐          ┌─────────────▼──────────┐
    │ Observability      │          │ Resilience Layer       │
    │ - Logs (PM2 + JSON)│          │ - Retries (backoff)    │
    │ - Metrics          │          │ - Circuit Breaker      │
    │ - Tracing          │          │ - Timeouts             │
    └────────────────────┘          └────────────────────────┘
```

### Service Responsibilities

#### Gateways

**Discovery Gateway (Port 8080)**
- Public entry point for end-user apps (Discovery clients)
- Request routing to Discovery/Search services
- JWT validation (when applicable) and RBAC enforcement
- API versioning (`/api/v1/...`)
- Rate limiting for critical/public endpoints (Redis)
- REST + GraphQL API exposure
- Swagger/OpenAPI docs + Postman collection
- Resilience (timeouts, retry, circuit breaker)

**CMS Gateway (Port 8081)**
- Internal entry point for CMS admins/editors
- JWT validation and RBAC (ADMIN/EDITOR)
- Routing to CMS/Metadata/Media/Ingest
- Rate limiting for write-heavy endpoints (Redis)
- API versioning and documentation
- Resilience (timeouts, retry, circuit breaker)

#### Core Services

**Auth Service (Port 8086)**
- User login and token issuance (JWT)
- Role management (ADMIN, EDITOR, USER)
- Password hashing/verification
- Token configuration and expiration policies
- Publishes auth/user lifecycle events (Kafka)
- Database: `auth_db`

**CMS Service (Port 8082)**
- CRUD for programs and episodes
- Publishing workflow (draft/published)
- Emits events (`content.created`, `content.updated`, `content.published`)
- Database: `cms_db`

**Metadata Service (Port 8083)**
- Stores/validates metadata (title, description, category, language, duration, publish date)
- Ensures consistent schema and versioning
- Database: `metadata_db`

**Media Service (Port 8084)**
- Handles thumbnails, assets, and storage references
- Integrates with Object Storage and CDN
- Database: `media_db` + Object Storage (S3/Spaces/MinIO)

**Ingest Service (Port 8085)**
- Connects to external sources (YouTube/RSS/APIs)
- Normalizes imported data into internal models
- Emits ingest events (`ingest.completed`, `ingest.failed`)
- Database: `ingest_db`

**Discovery Service (Port 8090)**
- Public search and browse APIs
- Database: `discovery_db`

**Search/Indexing Service (Port 8091)**
- Consumes Kafka events and updates search indexes
- Supports fast queries for Discovery
- Database: `search_db` and/or Search Engine (OpenSearch/Elasticsearch)

### Shared Module

The `shared` module contains reusable components used across all services:

- **DTOs & Contracts**: Shared schemas for requests/responses and inter-service payloads
- **Kafka Events**: Event types, versioning, and serializers
- **Guards & Decorators**: RBAC helpers, JWT utilities, request context decorators
- **Resilience Utilities**: retry/backoff and circuit breaker wrappers/interceptors
- **Observability Utilities**: correlation/trace ID propagation, structured log helpers
- **Common Tools**: errors, constants, pagination helpers, validation utilities

This ensures consistent behavior and reduces duplicated logic.

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

**Implementation**: Tokens validated at the gateway layer. See [Security](#security) section for details.

### 4. Role-Based Access Control (RBAC)

**Decision**: Role-based access control with well-defined roles (ADMIN, EDITOR, USER).

**Rationale**:
- **Least Privilege**: Users only access what they need
- **Clear Separation**: CMS roles (ADMIN/EDITOR) vs Discovery users (USER)
- **Extensible**: Easy to add new roles and permissions later

**Roles**:
- `ADMIN`: Full system access
- `EDITOR`: Content creation and management
- `USER`: Read-only access to Discovery APIs

Authorization enforced at both gateway and service levels.

### 5. Database per Service

**Decision**: Each microservice owns its database.

**Rationale**:
- **Data Isolation**: Services do not directly access each other's schema
- **Independent Deployment**: Schema changes don't break other services
- **Scaling**: Different databases can scale independently
- **Flexibility**: Each service can choose the best persistence approach

### 6. API Versioning

**Decision**: URL-based API versioning with backward compatibility.

**Rationale**:
- **Future-Proof**: Allows evolution without breaking existing clients
- **Migration Path**: Clients upgrade at their own pace
- **Clarity**: `/api/v1/...` is explicit and easy to manage

**Examples**:
- `GET /api/v1/discovery/search`
- `POST /api/v1/cms/programs`

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

**Implementation**:
- **Retries**: Controlled retries with exponential backoff for transient failures
- **Circuit Breaker**: Stops calls to failing services, automatically recovers when healthy
- Applied at gateway and inter-service communication layers

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

**Implementation**: See [Performance Optimization](#performance-optimization) section.

### 11. Rate Limiting

**Decision**: Redis-based distributed rate limiting for critical APIs.

**Rationale**:
- **Security**: Protect auth endpoints from brute-force attempts
- **Stability**: Prevent traffic spikes from exhausting resources
- **Distributed**: Works across multiple gateway instances

**Implementation**:
- **Strategy**: Token-bucket / sliding-window style
- **Enforcement**: Primarily at API Gateway layer
- **Dimensions**: User ID, IP address, or client type (CMS vs Discovery)
- **Targets**: Authentication endpoints, CMS write operations, expensive discovery search endpoints

### 12. Observability (Logs, Metrics, Tracing)

**Decision**: First-class observability built into gateways and services.

**Rationale**:
- **Logs**: Structured logs (JSON) with correlation IDs for debugging
- **Metrics**: Request count/latency/error rate and Kafka consumer lag
- **Tracing**: Trace IDs propagated across services and Kafka messages

**Implementation**:
- **Logging**: Structured JSON logs with request identifiers, service name, timestamp, and log level. PM2 aggregates logs per service.
- **Metrics**: Request count, response time, error rate, Kafka consumer lag
- **Distributed Tracing**: Unique trace IDs propagated across gateways, services, and Kafka events

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

- **Node.js 20+**
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

**Service Endpoints**:
- Discovery Gateway: http://localhost:8080
- CMS Gateway: http://localhost:8081
- Swagger: http://localhost:8080/docs (or /api/docs depending on your setup)
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
2. Implement changes with SOLID and clear module boundaries
3. Add/extend tests
4. Update Swagger docs + Postman collection if APIs change
5. Run test suite before merging

---

## 🚢 Deployment

### Local Development (Docker Compose)

```bash
docker compose build
docker compose up -d
```

### AWS Production Deployment

MediaMesh is designed for AWS cloud deployment. See [AWS Deployment Guide](./docs/AWS_DEPLOYMENT.md) for detailed instructions.

**AWS Services Used**:
- **ECS/EKS**: Container orchestration for microservices
- **RDS PostgreSQL**: Managed databases for each service
- **DynamoDB**: High-performance NoSQL for Discovery, Search, and Rate limiting
- **ElastiCache Redis**: Managed Redis for caching
- **MSK**: Managed Kafka for event streaming
- **S3**: Object storage for media assets
- **CloudFront**: CDN for content delivery
- **ALB**: Application Load Balancer
- **CloudWatch**: Monitoring and logging

### Production Considerations

1. Use AWS Secrets Manager for JWT and DB credentials
2. Run gateways behind ALB (scale horizontally with auto-scaling)
3. Use managed AWS services (RDS, ElastiCache, MSK)
4. Enable CloudFront CDN for media assets
5. Centralize logs + metrics + traces in CloudWatch
6. Configure health checks and readiness probes
7. Set up VPC with public/private subnets
8. Implement IAM roles and security groups

---

## 🧩 Technology Stack

### Core Technologies
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Architecture:** Microservices
- **Inter-service Communication:** Kafka (event-driven)
- **API Pattern:** Gateway Microservices Pattern
- **Authentication:** JWT (JSON Web Tokens)
- **Authorization:** Role-Based Access Control (RBAC)
- **Process Manager:** PM2

### Cloud Infrastructure (AWS)
- **Compute:** ECS/EKS for container orchestration
- **Databases:** 
  - RDS PostgreSQL (managed databases per service)
  - DynamoDB (for Discovery, Search, Rate limiting)
- **Caching:** ElastiCache Redis
- **Event Streaming:** MSK (Managed Kafka)
- **Object Storage:** S3 for media assets
- **Content Delivery:** CloudFront CDN
- **Load Balancing:** ALB/NLB
- **Monitoring:** CloudWatch

### Data & Storage
- **Primary Databases:** PostgreSQL (User, CMS, Metadata, Media, Ingest services)
- **NoSQL Database:** DynamoDB (Discovery hot data, Search indexes, Rate limiting)
- **Caching:** Redis (ElastiCache)
- **Object Storage:** AWS S3
- **Search Engine:** OpenSearch/Elasticsearch (planned)

### Additional Services
- **Rate Limiting:** Redis-backed distributed rate limiter
- **API Documentation:** Swagger/OpenAPI

---

## 🔐 Security

### Authentication

- **JWT-based authentication**: Stateless token validation
- **Token validation**: Performed at the gateway layer
- **No server-side sessions**: Enables horizontal scaling

### Authorization

- **Role-Based Access Control (RBAC)**: Enforced at gateway and service levels
- **Roles**: ADMIN, EDITOR, USER (see [Design Decisions](#4-role-based-access-control-rbac) for details)

---

## ⚡ Performance Optimization

### Caching

- **Strategy**: Cache-aside pattern with TTL
- **Primary Use**: Hot-read caching for discovery/search operations
- **Benefits**: Reduces database load and improves response times

### CDN

- **Purpose**: Serve static assets and media files
- **Benefits**: Reduces latency and improves global content delivery

### Scalability

For detailed information on achieving **10M users/hour** load, see the [Scalability Guide](./SCALABILITY_GUIDE.md).

**Key Strategies**:
- Horizontal scaling of gateways and services
- Redis cluster for distributed caching (95%+ hit rate target)
- Database read replicas for read-heavy workloads
- CDN for media assets (90%+ traffic offloaded)
- Kafka for event processing and load smoothing
- Elasticsearch/OpenSearch for production-grade search
- **CQRS pattern** for read/write separation (see [Design Patterns Guide](./DESIGN_PATTERNS_GUIDE.md))

---

## 🚀 Future Enhancements & TODOs

### High Priority

1. **Event Outbox Pattern (Consistency Guarantee)**
   - Add outbox table per service for guaranteed event publishing
   - Ensure business transaction + event persistence are atomic
   - Add outbox worker / CDC integration

2. **Full Search Engine Integration**
   - Integrate OpenSearch/Elasticsearch for production-grade search
   - Add analyzers for Arabic/English text and advanced ranking

3. **Advanced Observability**
   - OpenTelemetry end-to-end tracing visualization
   - Prometheus + Grafana dashboards
   - Alerting for errors, latency, circuit breaker status, and consumer lag

### Medium Priority

4. **Recommendation & Personalization**
   - Trending, popular, and recommended content
   - Personalized feed (optional auth)

5. **Advanced Caching**
   - Event-driven cache invalidation
   - Cache warming and multi-layer caching strategies

6. **Security Enhancements**
   - OAuth2/OIDC integration (optional)
   - API key management for external ingestion sources
   - Fine-grained permissions (scopes/claims)

### Low Priority

7. **API v2 Planning**
   - Introduce breaking changes safely via /api/v2/...
   - Deprecation roadmap and migration guide

---

Built with ❤️ using NestJS, Kafka, Redis, Docker, PM2, and modern microservices patterns.
