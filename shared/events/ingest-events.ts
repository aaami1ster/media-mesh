import { BaseEvent, EventMetadata, IngestEventType } from './event-types';

/**
 * Ingest Started Event
 */
export interface IngestStartedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: IngestEventType.INGEST_STARTED;
  };
  payload: {
    ingestId: string;
    contentId: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    startedBy: string;
    startedAt: string;
  };
}

/**
 * Ingest Progress Event
 */
export interface IngestProgressEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: IngestEventType.INGEST_PROGRESS;
  };
  payload: {
    ingestId: string;
    contentId: string;
    progress: number; // 0-100
    stage: string; // e.g., "uploading", "processing", "transcoding"
    message?: string;
    estimatedTimeRemaining?: number; // seconds
  };
}

/**
 * Ingest Completed Event
 */
export interface IngestCompletedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: IngestEventType.INGEST_COMPLETED;
  };
  payload: {
    ingestId: string;
    contentId: string;
    filename: string;
    mediaId: string;
    mediaUrl: string;
    duration?: number; // seconds
    fileSize: number;
    mimeType: string;
    completedAt: string;
    processingTime: number; // seconds
  };
}

/**
 * Ingest Failed Event
 */
export interface IngestFailedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: IngestEventType.INGEST_FAILED;
  };
  payload: {
    ingestId: string;
    contentId: string;
    filename: string;
    error: string;
    errorCode?: string;
    errorDetails?: any;
    failedAt: string;
    retryable: boolean;
  };
}

/**
 * Ingest Cancelled Event
 */
export interface IngestCancelledEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: IngestEventType.INGEST_CANCELLED;
  };
  payload: {
    ingestId: string;
    contentId: string;
    filename: string;
    cancelledBy: string;
    cancelledAt: string;
    reason?: string;
  };
}
