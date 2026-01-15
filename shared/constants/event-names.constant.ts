/**
 * Event Names Constants
 * 
 * Centralized event name constants for Kafka event streaming.
 * These constants ensure consistency across services.
 */

/**
 * Content-related events
 */
export const ContentEvents = {
  CREATED: 'content.created',
  UPDATED: 'content.updated',
  DELETED: 'content.deleted',
  PUBLISHED: 'content.published',
  UNPUBLISHED: 'content.unpublished',
  STATUS_CHANGED: 'content.status.changed',
} as const;

/**
 * Ingest-related events
 */
export const IngestEvents = {
  STARTED: 'ingest.started',
  PROGRESS: 'ingest.progress',
  COMPLETED: 'ingest.completed',
  FAILED: 'ingest.failed',
  CANCELLED: 'ingest.cancelled',
} as const;

/**
 * Metadata-related events
 */
export const MetadataEvents = {
  CREATED: 'metadata.created',
  UPDATED: 'metadata.updated',
  DELETED: 'metadata.deleted',
  BULK_CREATED: 'metadata.bulk.created',
} as const;

/**
 * Media-related events
 */
export const MediaEvents = {
  UPLOADED: 'media.uploaded',
  PROCESSED: 'media.processed',
  FAILED: 'media.failed',
  DELETED: 'media.deleted',
  TRANSCODED: 'media.transcoded',
} as const;

/**
 * Auth-related events
 */
export const AuthEvents = {
  USER_CREATED: 'auth.user.created',
  USER_UPDATED: 'auth.user.updated',
  USER_DELETED: 'auth.user.deleted',
  USER_LOGIN: 'auth.user.login',
  USER_LOGOUT: 'auth.user.logout',
  PASSWORD_CHANGED: 'auth.password.changed',
  ROLE_CHANGED: 'auth.role.changed',
} as const;

/**
 * Search-related events
 */
export const SearchEvents = {
  INDEXED: 'search.indexed',
  REINDEXED: 'search.reindexed',
  INDEX_DELETED: 'search.index.deleted',
  QUERY_EXECUTED: 'search.query.executed',
} as const;

/**
 * Discovery-related events
 */
export const DiscoveryEvents = {
  TRENDING_UPDATED: 'discovery.trending.updated',
  RECOMMENDATIONS_UPDATED: 'discovery.recommendations.updated',
  VIEWED: 'discovery.content.viewed',
} as const;

/**
 * All event names as a flat object
 */
export const EventNames = {
  // Content
  ...ContentEvents,
  // Ingest
  ...IngestEvents,
  // Metadata
  ...MetadataEvents,
  // Media
  ...MediaEvents,
  // Auth
  ...AuthEvents,
  // Search
  ...SearchEvents,
  // Discovery
  ...DiscoveryEvents,
} as const;

/**
 * Event name type
 */
export type EventName = typeof EventNames[keyof typeof EventNames];

/**
 * Get all event names
 */
export function getAllEventNames(): string[] {
  return Object.values(EventNames);
}

/**
 * Check if an event name is valid
 */
export function isValidEventName(eventName: string): eventName is EventName {
  return Object.values(EventNames).includes(eventName as EventName);
}
