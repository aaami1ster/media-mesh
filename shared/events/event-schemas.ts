/**
 * JSON Schemas for event validation
 * These schemas can be used with JSON Schema validators like Ajv
 */

export const EventMetadataSchema = {
  type: 'object',
  required: ['eventId', 'eventType', 'eventVersion', 'timestamp', 'source'],
  properties: {
    eventId: { type: 'string', format: 'uuid' },
    eventType: { type: 'string' },
    eventVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' }, // semver
    timestamp: { type: 'string', format: 'date-time' },
    source: { type: 'string' },
    correlationId: { type: 'string' },
    userId: { type: 'string', format: 'uuid' },
  },
};

export const BaseEventSchema = {
  type: 'object',
  required: ['metadata', 'payload'],
  properties: {
    metadata: EventMetadataSchema,
    payload: { type: 'object' },
  },
};

export const ContentCreatedEventSchema = {
  ...BaseEventSchema,
  properties: {
    ...BaseEventSchema.properties,
    metadata: {
      ...EventMetadataSchema,
      properties: {
        ...EventMetadataSchema.properties,
        eventType: { type: 'string', const: 'content.created' },
      },
    },
    payload: {
      type: 'object',
      required: ['contentId', 'contentType', 'title', 'createdBy'],
      properties: {
        contentId: { type: 'string', format: 'uuid' },
        contentType: { type: 'string' },
        title: { type: 'string', minLength: 1, maxLength: 200 },
        createdBy: { type: 'string', format: 'uuid' },
        program: { type: 'object' },
      },
    },
  },
};

export const IngestCompletedEventSchema = {
  ...BaseEventSchema,
  properties: {
    ...BaseEventSchema.properties,
    metadata: {
      ...EventMetadataSchema,
      properties: {
        ...EventMetadataSchema.properties,
        eventType: { type: 'string', const: 'ingest.completed' },
      },
    },
    payload: {
      type: 'object',
      required: [
        'ingestId',
        'contentId',
        'filename',
        'mediaId',
        'mediaUrl',
        'fileSize',
        'mimeType',
        'completedAt',
        'processingTime',
      ],
      properties: {
        ingestId: { type: 'string', format: 'uuid' },
        contentId: { type: 'string', format: 'uuid' },
        filename: { type: 'string' },
        mediaId: { type: 'string', format: 'uuid' },
        mediaUrl: { type: 'string', format: 'uri' },
        duration: { type: 'number', minimum: 0 },
        fileSize: { type: 'number', minimum: 0 },
        mimeType: { type: 'string' },
        completedAt: { type: 'string', format: 'date-time' },
        processingTime: { type: 'number', minimum: 0 },
      },
    },
  },
};

export const UserCreatedEventSchema = {
  ...BaseEventSchema,
  properties: {
    ...BaseEventSchema.properties,
    metadata: {
      ...EventMetadataSchema,
      properties: {
        ...EventMetadataSchema.properties,
        eventType: { type: 'string', const: 'auth.user.created' },
      },
    },
    payload: {
      type: 'object',
      required: ['userId', 'email', 'firstName', 'lastName', 'role'],
      properties: {
        userId: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        firstName: { type: 'string', minLength: 1, maxLength: 50 },
        lastName: { type: 'string', minLength: 1, maxLength: 50 },
        role: { type: 'string', enum: ['ADMIN', 'EDITOR', 'USER'] },
        createdBy: { type: 'string', format: 'uuid' },
        user: { type: 'object' },
      },
    },
  },
};
