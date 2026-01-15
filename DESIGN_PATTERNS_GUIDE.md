# Design Patterns for MediaMesh Scalability

This guide explains how design patterns, especially **CQRS (Command Query Responsibility Segregation)**, can significantly improve scalability and performance in MediaMesh.

---

## 📋 Table of Contents

- [CQRS Pattern](#cqrs-pattern)
- [Event Sourcing](#event-sourcing)
- [Saga Pattern](#saga-pattern)
- [Repository Pattern](#repository-pattern)
- [Cache Patterns](#cache-patterns)
- [Resilience Patterns](#resilience-patterns)
- [Other Useful Patterns](#other-useful-patterns)
- [Pattern Selection Guide](#pattern-selection-guide)
- [Implementation Roadmap](#implementation-roadmap)

---

## 🎯 CQRS Pattern

### What is CQRS?

**Command Query Responsibility Segregation** separates read operations (queries) from write operations (commands) into different models, services, or even databases.

### Why CQRS for MediaMesh?

**Perfect Fit for Discovery Service**:
- **Read-Heavy Workload**: 80% of traffic is reads (discovery, search, browse)
- **Write-Heavy Workload**: 20% is writes (CMS operations)
- **Different Optimization Needs**: Reads need caching, indexing, denormalization. Writes need consistency, validation, transactions.

### Benefits for Scalability

1. **Independent Scaling**: Scale read and write sides independently
2. **Optimized Models**: Read models can be denormalized for performance
3. **Better Caching**: Read models are cache-friendly
4. **Reduced Contention**: No read/write conflicts on the same data

### Architecture with CQRS

```
┌─────────────────────────────────────────────────────────┐
│                    Write Side (Commands)                 │
│                                                          │
│  CMS Gateway → CMS Service → Write Database (Primary)  │
│                    ↓                                    │
│              Kafka Events                               │
└─────────────────────────────────────────────────────────┘
                        │
                        │ (Async)
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    Read Side (Queries)                   │
│                                                          │
│  Discovery Gateway → Discovery Service → Read DB       │
│                    ↓                                    │
│              Redis Cache                                │
│                    ↓                                    │
│         Optimized Read Models                           │
└─────────────────────────────────────────────────────────┘
```

### Implementation Strategy

#### Option 1: Service-Level CQRS (Recommended for Start)

**Separate Services**:
- **Write Service**: CMS Service (handles commands)
- **Read Service**: Discovery Service (handles queries)

**Cursor Prompt**:
```
Implement CQRS pattern in MediaMesh:
- Keep CMS Service as write-only (commands: CreateProgram, UpdateProgram, PublishProgram)
- Keep Discovery Service as read-only (queries: GetProgram, SearchPrograms, GetTrending)
- Use Kafka events to sync write → read side
- Write side: Normalized data, transactions, validation
- Read side: Denormalized data, optimized indexes, caching
- Ensure eventual consistency between write and read sides
```

#### Option 2: Database-Level CQRS (Advanced)

**Separate Databases**:
- **Write Database**: Normalized, transactional (PostgreSQL)
- **Read Database**: Denormalized, optimized (PostgreSQL read replicas or separate DB)

**Cursor Prompt**:
```
Implement database-level CQRS:
- Write database: Normalized schema, ACID transactions
- Read database: Denormalized schema optimized for queries
- Use Kafka to sync write DB → read DB
- Read database has materialized views and pre-computed aggregations
- Implement read model builders that consume Kafka events
```

### CQRS Implementation Example

#### Write Side (CMS Service)

```typescript
// Command Handler
@CommandHandler(CreateProgramCommand)
export class CreateProgramHandler {
  async execute(command: CreateProgramCommand) {
    // 1. Validate
    // 2. Create in write database (normalized)
    const program = await this.programRepository.create({
      title: command.title,
      description: command.description,
      status: 'DRAFT',
    });
    
    // 3. Emit event
    await this.eventBus.publish(
      new ProgramCreatedEvent(program.id, program)
    );
    
    return program;
  }
}
```

#### Read Side (Discovery Service)

```typescript
// Query Handler
@QueryHandler(GetProgramQuery)
export class GetProgramHandler {
  async execute(query: GetProgramQuery) {
    // 1. Check cache
    const cached = await this.cache.get(`program:${query.id}`);
    if (cached) return cached;
    
    // 2. Query read database (denormalized, optimized)
    const program = await this.readRepository.findOne({
      where: { id: query.id, status: 'PUBLISHED' },
      include: ['metadata', 'episodes', 'media'], // Denormalized
    });
    
    // 3. Cache result
    await this.cache.set(`program:${query.id}`, program, 1800);
    
    return program;
  }
}
```

### When to Use CQRS

✅ **Use CQRS When**:
- Read and write workloads are very different
- Read operations are much more frequent than writes
- You need to scale reads and writes independently
- Read models need different optimization (denormalization, caching)

❌ **Avoid CQRS When**:
- Simple CRUD application with equal read/write ratio
- Team is small and complexity isn't justified
- Consistency requirements are strict (need immediate consistency)

---

## 📦 Event Sourcing

### What is Event Sourcing?

Store all changes as a sequence of events. The current state is derived by replaying events.

### Why Event Sourcing for MediaMesh?

**Benefits**:
- **Audit Trail**: Complete history of all changes
- **Time Travel**: Replay events to any point in time
- **Event Replay**: Rebuild read models from events
- **Decoupling**: Events are the source of truth

### Architecture

```
Write Side:
  Command → Event Store → Events
                          ↓
                    Kafka Events
                          ↓
Read Side:
  Events → Event Handlers → Read Models (Projections)
```

### Implementation

**Cursor Prompt**:
```
Implement Event Sourcing for CMS Service:
- Store all changes as events (ProgramCreated, ProgramUpdated, ProgramPublished)
- Event store: PostgreSQL table or dedicated event store
- Replay events to rebuild read models
- Use Kafka for event distribution
- Implement event versioning for schema evolution
- Add snapshots for performance (store current state periodically)
```

### Event Sourcing Example

```typescript
// Event Store
interface ProgramEvent {
  id: string;
  aggregateId: string; // program ID
  eventType: 'ProgramCreated' | 'ProgramUpdated' | 'ProgramPublished';
  eventData: any;
  timestamp: Date;
  version: number;
}

// Replay to build current state
async function buildProgramState(programId: string) {
  const events = await eventStore.getEvents(programId);
  let program = null;
  
  for (const event of events) {
    switch (event.eventType) {
      case 'ProgramCreated':
        program = { ...event.eventData, version: 1 };
        break;
      case 'ProgramUpdated':
        program = { ...program, ...event.eventData, version: event.version };
        break;
      case 'ProgramPublished':
        program = { ...program, status: 'PUBLISHED', publishedAt: event.timestamp };
        break;
    }
  }
  
  return program;
}
```

### When to Use Event Sourcing

✅ **Use When**:
- You need complete audit trail
- You need to rebuild state from events
- You want to decouple write and read models
- You need time-travel capabilities

❌ **Avoid When**:
- Simple CRUD operations
- Team lacks experience with event sourcing
- Performance is critical and event replay is expensive

---

## 🔄 Saga Pattern

### What is Saga Pattern?

Manages distributed transactions across multiple services using a sequence of local transactions with compensating actions.

### Why Saga for MediaMesh?

**Use Cases**:
- **Content Publishing**: Update CMS → Update Metadata → Update Media → Publish to Discovery
- **Ingest Workflow**: Fetch from source → Normalize → Create Program → Create Episodes → Index

### Implementation Options

#### Choreography (Event-Driven) - Recommended

**Services coordinate via events**:

```
CMS Service: PublishProgram → Emit ProgramPublishedEvent
    ↓
Metadata Service: Listens → Updates metadata status
    ↓
Search Service: Listens → Indexes content
    ↓
Discovery Service: Listens → Updates read model
```

**Cursor Prompt**:
```
Implement Saga pattern using choreography for content publishing:
- CMS Service: PublishProgram command → Emit ProgramPublishedEvent
- Metadata Service: Listen to event → Update metadata status → Emit MetadataUpdatedEvent
- Search Service: Listen to event → Index content → Emit ContentIndexedEvent
- Discovery Service: Listen to event → Update read model
- Each service handles its own transaction
- Implement compensating actions for rollback (e.g., UnpublishProgram event)
```

#### Orchestration (Centralized)

**Orchestrator coordinates the workflow**:

```typescript
@Injectable()
export class PublishProgramOrchestrator {
  async execute(programId: string) {
    try {
      // Step 1: Update CMS
      await this.cmsService.publish(programId);
      
      // Step 2: Update Metadata
      await this.metadataService.updateStatus(programId, 'PUBLISHED');
      
      // Step 3: Index Search
      await this.searchService.index(programId);
      
      // Step 4: Update Discovery
      await this.discoveryService.updateReadModel(programId);
    } catch (error) {
      // Compensating actions
      await this.cmsService.unpublish(programId);
      await this.metadataService.updateStatus(programId, 'DRAFT');
      throw error;
    }
  }
}
```

### When to Use Saga

✅ **Use When**:
- Distributed transactions across multiple services
- Need to maintain consistency across services
- Can tolerate eventual consistency

❌ **Avoid When**:
- All operations are in a single service/database
- Need strong ACID transactions
- Simpler solutions work

---

## 🗄️ Repository Pattern

### What is Repository Pattern?

Abstraction layer between business logic and data access.

### Why Repository for MediaMesh?

**Benefits**:
- **Testability**: Easy to mock data access
- **Flexibility**: Switch databases without changing business logic
- **Caching**: Add caching layer transparently
- **Query Optimization**: Centralize query logic

### Implementation

**Cursor Prompt**:
```
Implement Repository pattern in all services:
- Create IProgramRepository interface
- Implement ProgramRepository with TypeORM/Prisma
- Add caching layer in repository (transparent to service layer)
- Use repository in service layer, not direct DB access
- Make repositories testable with dependency injection
```

### Repository Example

```typescript
// Interface
interface IProgramRepository {
  findById(id: string): Promise<Program>;
  findAll(filters: ProgramFilters): Promise<Program[]>;
  create(data: CreateProgramDto): Promise<Program>;
  update(id: string, data: UpdateProgramDto): Promise<Program>;
}

// Implementation with Caching
@Injectable()
export class ProgramRepository implements IProgramRepository {
  constructor(
    private db: DataSource,
    private cache: CacheService,
  ) {}
  
  async findById(id: string): Promise<Program> {
    // Check cache first
    const cached = await this.cache.get(`program:${id}`);
    if (cached) return cached;
    
    // Query database
    const program = await this.db.findOne(Program, { where: { id } });
    
    // Cache result
    if (program) {
      await this.cache.set(`program:${id}`, program, 1800);
    }
    
    return program;
  }
}
```

---

## 💾 Cache Patterns

### 1. Cache-Aside (Lazy Loading)

**Pattern**: Application checks cache, if miss, loads from DB and populates cache.

**Use Case**: Discovery Service (already implemented)

### 2. Write-Through

**Pattern**: Write to cache and DB simultaneously.

**Use Case**: Frequently updated data that needs to be cached immediately.

**Cursor Prompt**:
```
Implement write-through caching for frequently updated content:
- When updating program, update both cache and database
- Ensure cache and DB are always in sync
- Use for hot content that's updated frequently
```

### 3. Write-Behind (Write-Back)

**Pattern**: Write to cache immediately, write to DB asynchronously.

**Use Case**: High-write scenarios where eventual consistency is acceptable.

**Cursor Prompt**:
```
Implement write-behind caching for high-write scenarios:
- Write to cache immediately
- Queue DB writes asynchronously
- Use for analytics, logging, or non-critical updates
- Ensure eventual consistency
```

### 4. Refresh-Ahead

**Pattern**: Proactively refresh cache before expiration.

**Use Case**: Popular content that should never expire.

**Cursor Prompt**:
```
Implement refresh-ahead caching for popular content:
- Monitor cache TTL
- Refresh cache when TTL < 20% remaining
- Use for top 1000 programs
- Ensure seamless user experience
```

---

## 🛡️ Resilience Patterns

### 1. Circuit Breaker (Already Implemented)

Prevents cascading failures by stopping calls to failing services.

### 2. Bulkhead Pattern

Isolates resources to prevent one failure from affecting others.

**Implementation**:
- Separate connection pools per service
- Isolate critical operations from non-critical

**Cursor Prompt**:
```
Implement bulkhead pattern:
- Separate connection pools for read and write operations
- Isolate critical services (auth, payment) from non-critical
- Use separate thread pools/workers for different operations
- Prevent resource exhaustion in one area from affecting others
```

### 3. Retry with Exponential Backoff (Already Implemented)

### 4. Timeout Pattern

Set timeouts for all external calls.

**Cursor Prompt**:
```
Implement timeout pattern:
- Set timeouts for all HTTP calls (5s for internal, 10s for external)
- Set timeouts for database queries (2s)
- Set timeouts for Kafka operations (5s)
- Fail fast when timeouts occur
```

---

## 🔧 Other Useful Patterns

### 1. Factory Pattern

Create objects without specifying exact class.

**Use Case**: Creating different ingest parsers (YouTube, RSS, API).

**Cursor Prompt**:
```
Implement factory pattern for ingest parsers:
- Create IngestParserFactory
- Factory creates appropriate parser based on source type (YouTube, RSS, API)
- Each parser implements IIngestParser interface
- Easy to add new parsers without changing existing code
```

### 2. Strategy Pattern

Define family of algorithms, make them interchangeable.

**Use Case**: Different search strategies (full-text, fuzzy, semantic).

**Cursor Prompt**:
```
Implement strategy pattern for search:
- Create ISearchStrategy interface
- Implement strategies: FullTextSearch, FuzzySearch, SemanticSearch
- Use strategy pattern to switch search algorithms
- Easy to add new search strategies
```

### 3. Observer Pattern

One-to-many dependency between objects.

**Use Case**: Notify multiple services when content is published.

**Already implemented via Kafka events!**

### 4. Decorator Pattern

Add behavior to objects dynamically.

**Use Case**: Adding caching, logging, validation to services.

**Cursor Prompt**:
```
Use decorator pattern with NestJS interceptors:
- Create caching interceptor (decorator)
- Create logging interceptor (decorator)
- Create validation interceptor (decorator)
- Apply decorators to controllers/methods
- Composable and reusable
```

---

## 🎯 Pattern Selection Guide

### For Scalability

| Pattern             | Scalability Benefit | Complexity | When to Use                    |
| ------------------- | ------------------- | ---------- | ------------------------------ |
| **CQRS**            | ⭐⭐⭐⭐⭐ High          | Medium     | Read/write separation needed   |
| **Event Sourcing**  | ⭐⭐⭐⭐ High           | High       | Need audit trail, event replay |
| **Saga**            | ⭐⭐⭐ Medium          | Medium     | Distributed transactions       |
| **Repository**      | ⭐⭐ Low              | Low        | Always (best practice)         |
| **Cache Patterns**  | ⭐⭐⭐⭐⭐ Very High     | Low        | Always for reads               |
| **Circuit Breaker** | ⭐⭐⭐⭐ High           | Low        | Always for resilience          |
| **Bulkhead**        | ⭐⭐⭐ Medium          | Medium     | Resource isolation needed      |

### Recommended Pattern Stack for MediaMesh

**High Priority (Implement Now)**:
1. ✅ **CQRS** - Separate read/write for Discovery
2. ✅ **Cache-Aside** - Already implemented
3. ✅ **Repository** - Standard practice
4. ✅ **Circuit Breaker** - Already implemented
5. ✅ **Saga (Choreography)** - For content publishing workflow

**Medium Priority (Consider Later)**:
6. **Event Sourcing** - If audit trail is critical
7. **Write-Through Cache** - For frequently updated content
8. **Bulkhead** - For resource isolation

**Low Priority (Nice to Have)**:
9. **Factory Pattern** - For ingest parsers
10. **Strategy Pattern** - For search algorithms

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation Patterns (Week 1-2)

**Cursor Prompt**:
```
Implement foundation patterns:
1. Repository pattern in all services
2. Cache-aside pattern in Discovery Service
3. Circuit breaker for all service calls
4. Timeout pattern for all external calls
```

### Phase 2: CQRS Implementation (Week 3-4)

**Cursor Prompt**:
```
Implement CQRS pattern:
1. Separate write side (CMS Service) from read side (Discovery Service)
2. Use Kafka events to sync write → read
3. Optimize read models (denormalize, add indexes)
4. Implement eventual consistency
5. Add monitoring for sync lag
```

### Phase 3: Saga Pattern (Week 5-6)

**Cursor Prompt**:
```
Implement Saga pattern for content publishing:
1. Use choreography (event-driven) approach
2. Implement publish workflow: CMS → Metadata → Search → Discovery
3. Add compensating actions for rollback
4. Test failure scenarios
```

### Phase 4: Advanced Patterns (Week 7-8)

**Cursor Prompt**:
```
Implement advanced patterns:
1. Event Sourcing for CMS (optional, if audit trail needed)
2. Write-through cache for hot content
3. Bulkhead pattern for resource isolation
4. Factory pattern for ingest parsers
```

---

## 📊 Performance Impact

### Expected Improvements with Patterns

| Pattern              | Performance Gain            | Scalability Gain      |
| -------------------- | --------------------------- | --------------------- |
| CQRS                 | +30-50% read performance    | 2-3x read scaling     |
| Cache-Aside          | +80-95% cache hit rate      | 5-10x read capacity   |
| Repository + Caching | +20-30% overall             | Better resource usage |
| Circuit Breaker      | Prevents cascading failures | Better stability      |
| Saga (Async)         | +40-60% write throughput    | Better write scaling  |

---

## 🎓 Key Takeaways

1. **CQRS is Highly Recommended**: Perfect for read-heavy workloads like Discovery
2. **Start Simple**: Repository + Cache-Aside + Circuit Breaker first
3. **Add Complexity Gradually**: CQRS → Saga → Event Sourcing
4. **Measure Impact**: Monitor performance before/after pattern implementation
5. **Team Knowledge**: Ensure team understands patterns before implementing

---

## 📚 Additional Resources

- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Event Sourcing - Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Saga Pattern - Microservices.io](https://microservices.io/patterns/data/saga.html)
- [Repository Pattern - Microsoft](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design)

---

**Remember**: Patterns are tools, not goals. Use them when they solve real problems. Start with simple patterns (Repository, Cache-Aside) and add complexity (CQRS, Event Sourcing) only when needed.
