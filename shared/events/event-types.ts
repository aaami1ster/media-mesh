/**
 * Event type enums for Kafka events
 */

/**
 * Content-related event types
 */
export enum ContentEventType {
  CONTENT_CREATED = 'content.created',
  CONTENT_UPDATED = 'content.updated',
  CONTENT_PUBLISHED = 'content.published',
  CONTENT_DELETED = 'content.deleted',
  CONTENT_ARCHIVED = 'content.archived',
  CONTENT_METADATA_UPDATED = 'content.metadata.updated',
}

/**
 * Ingest-related event types
 */
export enum IngestEventType {
  INGEST_STARTED = 'ingest.started',
  INGEST_PROGRESS = 'ingest.progress',
  INGEST_COMPLETED = 'ingest.completed',
  INGEST_FAILED = 'ingest.failed',
  INGEST_CANCELLED = 'ingest.cancelled',
}

/**
 * Authentication-related event types
 */
export enum AuthEventType {
  USER_CREATED = 'auth.user.created',
  USER_UPDATED = 'auth.user.updated',
  USER_DELETED = 'auth.user.deleted',
  USER_LOGIN = 'auth.user.login',
  USER_LOGOUT = 'auth.user.logout',
  TOKEN_REFRESHED = 'auth.token.refreshed',
  PASSWORD_CHANGED = 'auth.password.changed',
}

/**
 * Search-related event types
 */
export enum SearchEventType {
  SEARCH_PERFORMED = 'search.performed',
  SEARCH_INDEXED = 'search.indexed',
  SEARCH_INDEX_UPDATED = 'search.index.updated',
  SEARCH_INDEX_DELETED = 'search.index.deleted',
}

/**
 * Base event metadata
 */
export interface EventMetadata {
  eventId: string;
  eventType: string;
  eventVersion: string;
  timestamp: string;
  source: string; // service name
  correlationId?: string;
  userId?: string;
}

/**
 * Base event interface
 */
export interface BaseEvent {
  metadata: EventMetadata;
  payload: any;
}
