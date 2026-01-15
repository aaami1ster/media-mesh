# MediaMesh Scalability Guide: Achieving 10M Users/Hour

This guide provides a comprehensive strategy to scale MediaMesh to handle **10 million users per hour** (~2,778 requests/second peak).

> **💡 Design Patterns**: For information on how design patterns (CQRS, Event Sourcing, Saga) can improve scalability, see the [Design Patterns Guide](./DESIGN_PATTERNS_GUIDE.md).

---

## 📊 Understanding the Load

### Load Breakdown

**10M users/hour = ~2,778 requests/second (average)**
- **Peak load**: 3-5x average = **8,000-14,000 requests/second**
- **Read-heavy**: ~80% read operations (discovery, search, browse)
- **Write operations**: ~20% (CMS, auth, ingestion)

### Request Distribution (Estimated)

| Endpoint Type | Percentage | RPS (Peak) | Strategy |
|--------------|------------|------------|----------|
| Discovery/Search | 60% | 4,800-8,400 | Heavy caching, CDN |
| Content Browse | 25% | 2,000-3,500 | Redis cache, read replicas |
| Authentication | 5% | 400-700 | Rate limiting, optimized DB |
| CMS Operations | 5% | 400-700 | Write optimization, async |
| Media Assets | 5% | 400-700 | CDN, object storage |

---

## 🏗️ Architecture for Scale

### High-Level Architecture

```
                    ┌─────────────────┐
                    │  Load Balancer   │
                    │  (NGINX/ALB)     │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│ Discovery GW   │  │ Discovery GW   │  │ Discovery GW   │
│ Instance 1     │  │ Instance 2     │  │ Instance N     │
│ (Port 8080)    │  │ (Port 8080)    │  │ (Port 8080)    │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│ Discovery Svc   │  │ Discovery Svc   │  │ Discovery Svc   │
│ Instance 1     │  │ Instance 2     │  │ Instance N     │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Redis Cluster   │
                    │  (Cache Layer)   │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│ Postgres       │  │ Postgres       │  │ Postgres       │
│ Primary        │  │ Read Replica 1 │  │ Read Replica N │
└────────────────┘  └────────────────┘  └────────────────┘
```

---

## 🚀 Scaling Strategies by Component

### 1. Load Balancer & Gateways

#### Strategy: Horizontal Scaling

**Implementation**:
- **Load Balancer**: NGINX, AWS ALB, or Cloudflare
- **Gateway Instances**: 10-20 instances behind load balancer
- **Health Checks**: Active health checks every 5 seconds
- **Session Affinity**: Not needed (stateless JWT)

**Cursor Prompt**:
```
Configure horizontal scaling for Discovery Gateway:
- Set up load balancer (NGINX or cloud provider)
- Configure health check endpoint /health
- Enable sticky sessions (if needed) or use round-robin
- Configure auto-scaling based on CPU/memory/request rate
- Set up multiple gateway instances (start with 5, scale to 20)
- Use environment variables for service discovery
```

**Scaling Metrics**:
- **Target**: 200-300 requests/second per gateway instance
- **Auto-scale when**: CPU > 70% or latency > 200ms
- **Min instances**: 5
- **Max instances**: 20

---

### 2. Discovery Service

#### Strategy: Horizontal Scaling + Aggressive Caching + CQRS

**Implementation**:
- **Service Instances**: 15-30 instances
- **Redis Cache**: 95%+ cache hit rate target
- **Database**: Read replicas (3-5 replicas)
- **CQRS Pattern**: Separate read models optimized for queries (see [Design Patterns Guide](./DESIGN_PATTERNS_GUIDE.md))
- **Cache TTL**: 
  - Popular programs: 30 minutes
  - Search results: 5 minutes
  - Trending content: 10 minutes

**Cursor Prompt**:
```
Optimize Discovery Service for high load:
- Implement multi-layer caching (in-memory + Redis)
- Cache popular programs with 30min TTL
- Cache search results with 5min TTL
- Use Redis cluster for distributed caching
- Implement cache warming for popular content
- Add database connection pooling (50-100 connections per instance)
- Use read replicas for all queries
- Implement query result pagination (max 50 items per page)
```

**Performance Targets**:
- **Response Time**: < 50ms (cached), < 200ms (uncached)
- **Cache Hit Rate**: > 95%
- **Database Queries**: < 5% of requests (95% from cache)

---

### 3. Redis Caching Strategy

#### Strategy: Redis Cluster + Multi-Layer Caching

**Implementation**:
- **Redis Cluster**: 6 nodes (3 master, 3 replica)
- **Memory**: 32GB+ per node
- **Cache Patterns**:
  - **Cache-Aside**: For programs/episodes
  - **Write-Through**: For frequently updated content
  - **Cache Warming**: Pre-populate popular content

**Cursor Prompt**:
```
Set up Redis cluster for high-performance caching:
- Configure Redis cluster (6 nodes: 3 master, 3 replica)
- Implement cache-aside pattern for discovery endpoints
- Set TTLs: programs (30min), episodes (20min), search (5min)
- Implement cache warming for top 1000 programs
- Add cache invalidation on content updates (via Kafka events)
- Monitor cache hit rate (target > 95%)
- Use Redis pipelining for batch operations
- Configure Redis persistence (AOF + RDB)
```

**Cache Keys Strategy**:
```
program:{id}                    → TTL: 30min
program:{id}:episodes           → TTL: 20min
search:{query}:{page}:{limit}   → TTL: 5min
trending:{category}             → TTL: 10min
popular:{category}              → TTL: 15min
```

---

### 4. Database Scaling

#### Strategy: Read Replicas + Connection Pooling + Query Optimization

**Implementation**:
- **Primary Database**: Write operations only
- **Read Replicas**: 3-5 replicas for read operations
- **Connection Pooling**: 50-100 connections per service instance
- **Query Optimization**: Indexes, query tuning, materialized views

**Cursor Prompt**:
```
Optimize database for high read load:
- Set up PostgreSQL read replicas (3-5 replicas)
- Configure connection pooling (PgBouncer or built-in pooler)
- Add database indexes on: contentId, category, language, publishedAt, status
- Create materialized views for trending/popular content (refresh every 5min)
- Use database query result caching where possible
- Implement read/write splitting (all SELECTs go to replicas)
- Monitor slow queries and optimize
- Set up database connection limits (max 1000 connections total)
```

**Database Optimization**:
- **Indexes**: 
  - `programs(status, publishedAt)` - for published content queries
  - `episodes(programId, episodeNumber)` - for episode listings
  - `metadata(contentId, category, language)` - for filtering
- **Materialized Views**: 
  - `trending_programs` - refreshed every 5 minutes
  - `popular_programs` - refreshed every 10 minutes
- **Connection Pooling**: PgBouncer with transaction pooling

---

### 5. Kafka for Event Processing

#### Strategy: Partitioning + Consumer Groups

**Implementation**:
- **Kafka Cluster**: 3-5 brokers
- **Topic Partitions**: 10-20 partitions per topic
- **Consumer Groups**: Scale consumers horizontally
- **Batch Processing**: Process events in batches

**Cursor Prompt**:
```
Configure Kafka for high-throughput event processing:
- Set up Kafka cluster (3-5 brokers)
- Configure topics with 10-20 partitions each
- Use consumer groups for parallel processing
- Implement batch processing (process 100-1000 events per batch)
- Set up Kafka monitoring (consumer lag, throughput)
- Configure retention policies (7 days for events)
- Use compression (snappy or lz4)
- Monitor and scale consumers based on lag
```

**Kafka Topics Configuration**:
```
content.events:
  - Partitions: 20
  - Replication: 3
  - Retention: 7 days
  
ingest.events:
  - Partitions: 10
  - Replication: 3
  - Retention: 7 days
```

---

### 6. Search Service

#### Strategy: Elasticsearch/OpenSearch + Caching

**Implementation**:
- **Search Engine**: Elasticsearch/OpenSearch cluster (5-10 nodes)
- **Indexing**: Async via Kafka consumers
- **Caching**: Cache search results in Redis
- **Sharding**: Shard indexes by content type

**Cursor Prompt**:
```
Set up production-grade search with Elasticsearch/OpenSearch:
- Deploy Elasticsearch cluster (5-10 nodes)
- Create indexes with proper sharding (5 shards per index)
- Implement async indexing via Kafka consumers
- Cache search results in Redis (5min TTL)
- Use search result pagination (max 50 results per page)
- Implement search query optimization
- Monitor search performance and latency
- Set up index aliases for zero-downtime updates
```

---

### 7. Media & CDN

#### Strategy: CDN + Object Storage

**Implementation**:
- **CDN**: Cloudflare, AWS CloudFront, or similar
- **Object Storage**: S3, DigitalOcean Spaces, or MinIO
- **Cache Headers**: Aggressive caching for static assets
- **Image Optimization**: Serve optimized thumbnails

**Cursor Prompt**:
```
Optimize media delivery for scale:
- Configure CDN (Cloudflare/AWS CloudFront) for all media assets
- Set cache headers: images (1 year), thumbnails (30 days)
- Use object storage (S3/Spaces) with CDN in front
- Generate multiple thumbnail sizes (small, medium, large)
- Implement lazy loading for images
- Use WebP format for images where supported
- Monitor CDN hit rate (target > 90%)
- Set up CDN purging on content updates
```

**CDN Configuration**:
- **Cache TTL**: 
  - Images: 1 year
  - Thumbnails: 30 days
  - Videos: 7 days
- **CDN Hit Rate Target**: > 90%

---

### 8. Authentication Service

#### Strategy: Optimization + Rate Limiting

**Implementation**:
- **Service Instances**: 3-5 instances (lower load)
- **Database**: Optimized with indexes
- **Rate Limiting**: Strict limits (100 requests/minute per IP)
- **Token Caching**: Cache validated tokens

**Cursor Prompt**:
```
Optimize Auth Service for scale:
- Add database indexes on email and userId
- Implement token validation caching (cache valid tokens for 5min)
- Use bcrypt with optimized rounds (10-12 rounds)
- Implement rate limiting (100 requests/min per IP)
- Use connection pooling (20-30 connections per instance)
- Monitor authentication latency (target < 100ms)
- Implement token refresh endpoint optimization
```

---

## 📈 Performance Optimization Checklist

### Application Level

- [ ] **Connection Pooling**: Database connections pooled (50-100 per instance)
- [ ] **Query Optimization**: All queries use indexes, no N+1 queries
- [ ] **Response Compression**: Gzip/Brotli compression enabled
- [ ] **HTTP/2**: Enable HTTP/2 for better multiplexing
- [ ] **Keep-Alive**: Enable HTTP keep-alive connections
- [ ] **Async Operations**: All I/O operations are async
- [ ] **Batch Processing**: Batch database queries where possible
- [ ] **Pagination**: All list endpoints support pagination (max 50 items)

### Caching Level

- [ ] **Multi-Layer Caching**: In-memory + Redis + CDN
- [ ] **Cache Hit Rate**: > 95% for discovery endpoints
- [ ] **Cache Warming**: Pre-populate popular content
- [ ] **Cache Invalidation**: Event-driven cache invalidation
- [ ] **Cache Headers**: Proper HTTP cache headers

### Database Level

- [ ] **Read Replicas**: 3-5 read replicas configured
- [ ] **Connection Pooling**: PgBouncer or built-in pooler
- [ ] **Indexes**: All query patterns have indexes
- [ ] **Materialized Views**: For expensive aggregations
- [ ] **Query Monitoring**: Slow query logging enabled
- [ ] **Vacuum/Analyze**: Regular maintenance scheduled

### Infrastructure Level

- [ ] **Load Balancer**: Configured with health checks
- [ ] **Auto-Scaling**: Based on CPU, memory, request rate
- [ ] **Health Checks**: All services have /health endpoints
- [ ] **Monitoring**: Metrics, logs, and tracing configured
- [ ] **CDN**: Configured for all static assets
- [ ] **Redis Cluster**: 6 nodes (3 master, 3 replica)

---

## 🧪 Performance Testing

### Load Testing Strategy

**Tools**: k6, Artillery, or JMeter

**Test Scenarios**:

1. **Baseline Test**: 1,000 RPS for 10 minutes
2. **Peak Load Test**: 3,000 RPS for 30 minutes
3. **Spike Test**: 10,000 RPS for 5 minutes
4. **Endurance Test**: 2,000 RPS for 2 hours

**Cursor Prompt**:
```
Create load testing scripts for MediaMesh:
- Use k6 or Artillery for load testing
- Test scenarios:
  1. Baseline: 1000 RPS for 10min
  2. Peak load: 3000 RPS for 30min
  3. Spike: 10000 RPS for 5min
  4. Endurance: 2000 RPS for 2 hours
- Monitor: response time (p50, p95, p99), error rate, throughput
- Test endpoints: discovery/search, programs, episodes, auth
- Generate performance reports
```

**Performance Targets**:
- **Response Time (p95)**: < 200ms
- **Response Time (p99)**: < 500ms
- **Error Rate**: < 0.1%
- **Throughput**: Handle 3,000+ RPS sustained

---

## 📊 Monitoring & Observability

### Key Metrics to Monitor

1. **Request Metrics**:
   - Requests per second (RPS)
   - Response time (p50, p95, p99)
   - Error rate
   - Throughput

2. **Cache Metrics**:
   - Cache hit rate (target > 95%)
   - Cache miss rate
   - Redis memory usage
   - Redis connection count

3. **Database Metrics**:
   - Query latency
   - Connection pool usage
   - Read replica lag
   - Slow queries

4. **Service Metrics**:
   - CPU usage
   - Memory usage
   - Kafka consumer lag
   - Circuit breaker status

**Cursor Prompt**:
```
Set up comprehensive monitoring for MediaMesh:
- Prometheus for metrics collection
- Grafana dashboards for visualization
- Alert on: error rate > 1%, latency p95 > 500ms, cache hit rate < 90%
- Monitor: RPS, response times, cache hit rate, DB connections, Kafka lag
- Set up distributed tracing (OpenTelemetry)
- Log aggregation (ELK stack or similar)
```

---

## 🎯 Scaling Roadmap

### Phase 1: Foundation (Current)
- Basic microservices architecture
- Single instance per service
- Basic Redis caching
- Single database per service

**Capacity**: ~100-500 RPS

### Phase 2: Horizontal Scaling
- Load balancer + multiple gateway instances
- Multiple service instances
- Redis cluster
- Database read replicas

**Capacity**: ~2,000-5,000 RPS

### Phase 3: Optimization
- Aggressive caching (95%+ hit rate)
- CDN for media assets
- Query optimization
- Materialized views

**Capacity**: ~5,000-10,000 RPS

### Phase 4: Production Scale
- Auto-scaling groups
- Elasticsearch/OpenSearch
- Advanced monitoring
- Performance tuning

**Capacity**: **10,000+ RPS (10M users/hour)**

---

## 💰 Cost Estimation (Rough)

### Infrastructure Costs (Monthly)

| Component | Instances | Cost/Month (USD) |
|-----------|-----------|------------------|
| Load Balancer | 1 | $20-50 |
| Gateway Instances | 20 (2 vCPU, 4GB) | $400-800 |
| Service Instances | 50 (2 vCPU, 4GB) | $1,000-2,000 |
| Redis Cluster | 6 nodes (8GB each) | $300-600 |
| PostgreSQL | 1 primary + 5 replicas | $500-1,000 |
| Kafka Cluster | 5 brokers | $300-600 |
| Elasticsearch | 10 nodes | $1,000-2,000 |
| CDN | Traffic-based | $200-500 |
| **Total** | | **$3,720-7,550/month** |

*Note: Costs vary significantly by cloud provider and region*

---

## 🚀 Quick Start: Scaling Implementation

### Step 1: Add Load Balancer

**Cursor Prompt**:
```
Set up NGINX load balancer for Discovery Gateway:
- Configure upstream servers (5 gateway instances)
- Enable health checks
- Configure load balancing algorithm (least_conn or round_robin)
- Set up SSL/TLS termination
- Configure rate limiting at load balancer level
```

### Step 2: Scale Gateway Instances

**Cursor Prompt**:
```
Deploy multiple Discovery Gateway instances:
- Use Docker/Kubernetes for orchestration
- Configure 5 instances initially
- Set up auto-scaling (scale when CPU > 70%)
- Configure service discovery
- Test load distribution
```

### Step 3: Optimize Caching

**Cursor Prompt**:
```
Implement aggressive caching in Discovery Service:
- Increase cache TTLs (programs: 30min, search: 5min)
- Implement cache warming for top 100 programs
- Add cache hit rate monitoring
- Set up Redis cluster (6 nodes)
- Test cache performance
```

### Step 4: Add Read Replicas

**Cursor Prompt**:
```
Set up PostgreSQL read replicas:
- Create 3 read replicas
- Configure read/write splitting in services
- Update connection strings
- Test read replica lag
- Monitor query distribution
```

### Step 5: Enable CDN

**Cursor Prompt**:
```
Configure CDN for media assets:
- Set up Cloudflare or AWS CloudFront
- Configure cache rules (images: 1 year, thumbnails: 30 days)
- Update media URLs to use CDN
- Test CDN hit rate
- Monitor CDN performance
```

---

## 📝 Implementation Checklist

### Immediate (Week 1-2)
- [ ] Set up load balancer
- [ ] Deploy 5 gateway instances
- [ ] Configure Redis cluster
- [ ] Add database read replicas
- [ ] Implement cache warming

### Short-term (Week 3-4)
- [ ] Enable CDN for media
- [ ] Optimize database queries
- [ ] Add materialized views
- [ ] Implement auto-scaling
- [ ] Set up monitoring

### Medium-term (Month 2)
- [ ] Deploy Elasticsearch/OpenSearch
- [ ] Optimize Kafka consumers
- [ ] Performance testing
- [ ] Fine-tune caching
- [ ] Cost optimization

### Long-term (Month 3+)
- [ ] Advanced monitoring
- [ ] Predictive scaling
- [ ] Multi-region deployment
- [ ] Advanced caching strategies
- [ ] Continuous optimization

---

## 🎓 Key Takeaways

1. **Horizontal Scaling**: Scale out, not up
2. **Caching is Critical**: 95%+ cache hit rate for reads
3. **Read Replicas**: Essential for database scaling
4. **CDN**: Offloads 90%+ of media traffic
5. **Monitoring**: Essential for identifying bottlenecks
6. **Incremental**: Scale gradually, measure, optimize

---

## 📚 Additional Resources

- [NGINX Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [Redis Cluster Tutorial](https://redis.io/docs/manual/scaling/)
- [PostgreSQL Read Replicas](https://www.postgresql.org/docs/current/high-availability.html)
- [Kafka Performance Tuning](https://kafka.apache.org/documentation/#performance)
- [Elasticsearch Scaling](https://www.elastic.co/guide/en/elasticsearch/reference/current/scalability.html)

---

**Remember**: Scaling is an iterative process. Start small, measure, optimize, and scale incrementally. Monitor everything and adjust based on real-world performance data.
