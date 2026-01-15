# MediaMesh Platform

MediaMesh is a cloud-native, microservices-based platform for managing, storing, and discovering visual programs such as podcasts and documentaries.  
The system is designed using modern backend architecture principles with scalability, security, resilience, performance, and observability in mind.

---

## 📌 Project Overview

The platform consists of two main components:

### 1. Content Management System (CMS)
An internal system used by content editors and administrators to:
- Create and manage visual programs and episodes
- Edit and maintain metadata such as title, description, category, language, duration, and publish date
- Prepare the system for future content ingestion from multiple external sources (e.g., YouTube, RSS, APIs)

### 2. Discovery System
A public-facing system that allows end users to:
- Search for programs and episodes
- Browse content using filters such as category and language
- Discover available content efficiently

---

## 🏗 Architecture Overview


MediaMesh follows a **Microservices Architecture** built with **NestJS**, where each service is responsible for a single business capability.

### Key Architectural Principles
- Microservices per domain responsibility
- Event-driven communication (Kafka)
- Gateway pattern for client isolation and security
- Shared module for common tools and contracts
- Cloud-native and horizontally scalable design
- Resilient inter-service communication (retries + circuit breaker)
- Production-ready non-functional requirements (caching, CDN, rate limiting, observability)

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

## 📁 Project Structure
```
root
│
├── services
│   ├── cms-service
│   ├── discovery-service
│   ├── metadata-service
│   ├── ingest-service
│   ├── search-service
│   ├── api-gateway-cms
│   ├── api-gateway-discovery
│   └── auth-service
│
├── shared
│   ├── dto
│   ├── events
│   ├── utils
│   ├── constants
│   ├── guards
│   ├── resilience
│   └── observability
│
├── package.json
└── README.md
```


---

## 🚀 Future Enhancements

- External content ingestion (YouTube, RSS feeds)
- Recommendation engine
- Advanced analytics dashboards
- Multi-language discovery
- Full distributed tracing visualization
- Alerting and monitoring integration

---

## 📖 Conclusion

MediaMesh demonstrates a modern, resilient, and observable backend platform using NestJS microservices, Kafka-based event-driven communication, gateway isolation, retry and circuit breaker patterns, PM2 process management, and full observability practices.  
The system is designed to be scalable, secure, fault-tolerant, and production-ready.

---