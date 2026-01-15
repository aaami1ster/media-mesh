import { BaseEvent, EventMetadata, ContentEventType } from './event-types';
import { ProgramDto } from '../dto';

/**
 * Content Created Event
 */
export interface ContentCreatedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: ContentEventType.CONTENT_CREATED;
  };
  payload: {
    contentId: string;
    contentType: string;
    title: string;
    createdBy: string;
    program?: ProgramDto;
  };
}

/**
 * Content Updated Event
 */
export interface ContentUpdatedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: ContentEventType.CONTENT_UPDATED;
  };
  payload: {
    contentId: string;
    contentType: string;
    title: string;
    updatedBy: string;
    changes: Record<string, { old: any; new: any }>;
    program?: Partial<ProgramDto>;
  };
}

/**
 * Content Published Event
 */
export interface ContentPublishedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: ContentEventType.CONTENT_PUBLISHED;
  };
  payload: {
    contentId: string;
    contentType: string;
    title: string;
    publishedBy: string;
    publishedAt: string;
    program?: ProgramDto;
  };
}

/**
 * Content Deleted Event
 */
export interface ContentDeletedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: ContentEventType.CONTENT_DELETED;
  };
  payload: {
    contentId: string;
    contentType: string;
    title: string;
    deletedBy: string;
    deletedAt: string;
  };
}

/**
 * Content Archived Event
 */
export interface ContentArchivedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: ContentEventType.CONTENT_ARCHIVED;
  };
  payload: {
    contentId: string;
    contentType: string;
    title: string;
    archivedBy: string;
    archivedAt: string;
  };
}

/**
 * Content Metadata Updated Event
 */
export interface ContentMetadataUpdatedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: ContentEventType.CONTENT_METADATA_UPDATED;
  };
  payload: {
    contentId: string;
    metadataKey: string;
    oldValue?: any;
    newValue: any;
    updatedBy: string;
  };
}
