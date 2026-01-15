import { BaseEvent, EventMetadata, SearchEventType } from './event-types';

/**
 * Search Performed Event
 */
export interface SearchPerformedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: SearchEventType.SEARCH_PERFORMED;
  };
  payload: {
    query: string;
    filters?: Record<string, any>;
    resultsCount: number;
    searchTime: number; // milliseconds
    userId?: string;
    sessionId?: string;
  };
}

/**
 * Search Indexed Event
 */
export interface SearchIndexedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: SearchEventType.SEARCH_INDEXED;
  };
  payload: {
    contentId: string;
    contentType: string;
    title: string;
    indexedAt: string;
    indexVersion: string;
  };
}

/**
 * Search Index Updated Event
 */
export interface SearchIndexUpdatedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: SearchEventType.SEARCH_INDEX_UPDATED;
  };
  payload: {
    contentId: string;
    contentType: string;
    title: string;
    updatedAt: string;
    indexVersion: string;
    changes: string[]; // fields that changed
  };
}

/**
 * Search Index Deleted Event
 */
export interface SearchIndexDeletedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: SearchEventType.SEARCH_INDEX_DELETED;
  };
  payload: {
    contentId: string;
    contentType: string;
    deletedAt: string;
  };
}
