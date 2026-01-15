# Kafka Event Schemas

This module provides Kafka event schemas, types, and utilities for MediaMesh microservices.

---

## 📋 Event Types

### Content Events
- `CONTENT_CREATED` - Content created
- `CONTENT_UPDATED` - Content updated
- `CONTENT_PUBLISHED` - Content published
- `CONTENT_DELETED` - Content deleted
- `CONTENT_ARCHIVED` - Content archived
- `CONTENT_METADATA_UPDATED` - Content metadata updated

### Ingest Events
- `INGEST_STARTED` - Ingest process started
- `INGEST_PROGRESS` - Ingest progress update
- `INGEST_COMPLETED` - Ingest completed successfully
- `INGEST_FAILED` - Ingest failed
- `INGEST_CANCELLED` - Ingest cancelled

### Auth Events
- `USER_CREATED` - User account created
- `USER_UPDATED` - User account updated
- `USER_DELETED` - User account deleted
- `USER_LOGIN` - User logged in
- `USER_LOGOUT` - User logged out
- `TOKEN_REFRESHED` - JWT token refreshed
- `PASSWORD_CHANGED` - User password changed

### Search Events
- `SEARCH_PERFORMED` - Search query performed
- `SEARCH_INDEXED` - Content indexed for search
- `SEARCH_INDEX_UPDATED` - Search index updated
- `SEARCH_INDEX_DELETED` - Search index deleted

---

## 🎯 Event Interfaces

### Content Events

#### ContentCreatedEvent
```typescript
{
  metadata: {
    eventId: string;
    eventType: 'content.created';
    eventVersion: string;
    timestamp: string;
    source: string;
    correlationId?: string;
    userId?: string;
  };
  payload: {
    contentId: string;
    contentType: string;
    title: string;
    createdBy: string;
    program?: ProgramDto;
  };
}
```

#### ContentUpdatedEvent
Tracks changes with old/new values for each field.

#### ContentPublishedEvent
Published content with publication timestamp.

### Ingest Events

#### IngestCompletedEvent
```typescript
{
  metadata: EventMetadata;
  payload: {
    ingestId: string;
    contentId: string;
    filename: string;
    mediaId: string;
    mediaUrl: string;
    duration?: number;
    fileSize: number;
    mimeType: string;
    completedAt: string;
    processingTime: number;
  };
}
```

#### IngestFailedEvent
Includes error details and retryability flag.

### Auth Events

#### UserCreatedEvent
```typescript
{
  metadata: EventMetadata;
  payload: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdBy?: string;
    user?: UserDto;
  };
}
```

### Search Events

#### SearchPerformedEvent
Tracks search queries with results count and performance metrics.

---

## 🔧 Event Serialization

### Serialize Event
```typescript
import { serializeEvent, serializeEventToBuffer } from '@shared/events';

const event: ContentCreatedEvent = { /* ... */ };

// To JSON string
const json = serializeEvent(event);

// To Buffer (for Kafka)
const buffer = serializeEventToBuffer(event);
```

### Deserialize Event
```typescript
import { deserializeEvent, deserializeEventFromBuffer } from '@shared/events';

// From JSON string
const event = deserializeEvent<ContentCreatedEvent>(json);

// From Buffer (from Kafka)
const event = deserializeEventFromBuffer<ContentCreatedEvent>(buffer);
```

### Create Event Metadata
```typescript
import { createEventMetadata } from '@shared/events';

const metadata = createEventMetadata(
  ContentEventType.CONTENT_CREATED,
  'cms-service',
  {
    correlationId: 'req-123',
    userId: 'user-456',
    eventVersion: '1.0.0',
  }
);
```

---

## 📊 Event Versioning

### Version Comparison
```typescript
import { compareVersions, isCompatibleVersion } from '@shared/events';

compareVersions('1.0.0', '1.1.0'); // -1 (v1 < v2)
isCompatibleVersion('1.0.0', '1.2.0'); // true (same major)
```

### Event Migration
```typescript
import { migrateEvent, CURRENT_EVENT_VERSION } from '@shared/events';

const migrated = migrateEvent(oldEvent, '2.0.0');
```

### Version Constants
```typescript
import { EVENT_VERSIONS, CURRENT_EVENT_VERSION } from '@shared/events';

EVENT_VERSIONS.V1_0_0; // '1.0.0'
CURRENT_EVENT_VERSION; // '1.0.0'
```

---

## ✅ Event Validation

### JSON Schema Validation

Event schemas are provided for validation using Ajv or similar validators:

```typescript
import Ajv from 'ajv';
import { ContentCreatedEventSchema } from '@shared/events';

const ajv = new Ajv();
const validate = ajv.compile(ContentCreatedEventSchema);

const isValid = validate(event);
if (!isValid) {
  console.error(validate.errors);
}
```

### Structure Validation
```typescript
import { validateEvent } from '@shared/events';

if (validateEvent(event)) {
  // Event structure is valid
}
```

---

## 📝 Usage Example

### Publishing an Event

```typescript
import {
  ContentCreatedEvent,
  ContentEventType,
  createEventMetadata,
  serializeEventToBuffer,
} from '@shared/events';
import { KafkaProducer } from '@nestjs/microservices';

// Create event
const event: ContentCreatedEvent = {
  metadata: createEventMetadata(
    ContentEventType.CONTENT_CREATED,
    'cms-service',
    { correlationId: request.headers['x-correlation-id'] }
  ),
  payload: {
    contentId: program.id,
    contentType: 'PROGRAM',
    title: program.title,
    createdBy: user.id,
    program: programDto,
  },
};

// Serialize and publish
const buffer = serializeEventToBuffer(event);
await kafkaProducer.send({
  topic: 'content.events',
  messages: [{ value: buffer }],
});
```

### Consuming an Event

```typescript
import {
  IngestCompletedEvent,
  deserializeEventFromBuffer,
} from '@shared/events';

@MessagePattern('ingest.completed')
async handleIngestCompleted(message: KafkaMessage) {
  const event = deserializeEventFromBuffer<IngestCompletedEvent>(
    message.value as Buffer
  );

  // Process event
  await this.searchService.indexContent(event.payload.contentId);
}
```

---

## 🔄 Event Versioning Strategy

1. **Major Version (X.0.0)**: Breaking changes - incompatible payload structure
2. **Minor Version (0.X.0)**: New optional fields added
3. **Patch Version (0.0.X)**: Bug fixes, no structural changes

### Migration Strategy

- Consumers should support multiple major versions
- Use `isCompatibleVersion()` to check compatibility
- Implement migration logic in `migrateEvent()` for breaking changes
- Log warnings for unsupported versions

---

## 📚 Additional Resources

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [JSON Schema](https://json-schema.org/)
- [Ajv Validator](https://ajv.js.org/)
