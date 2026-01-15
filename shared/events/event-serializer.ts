/**
 * Event serialization and deserialization utilities
 */

import { BaseEvent, EventMetadata } from './event-types';

/**
 * Serialize event to JSON string
 */
export function serializeEvent(event: BaseEvent): string {
  return JSON.stringify(event, null, 0);
}

/**
 * Deserialize event from JSON string
 */
export function deserializeEvent<T extends BaseEvent>(
  json: string,
): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    throw new Error(`Failed to deserialize event: ${error.message}`);
  }
}

/**
 * Serialize event to Buffer (for Kafka)
 */
export function serializeEventToBuffer(event: BaseEvent): Buffer {
  return Buffer.from(serializeEvent(event), 'utf-8');
}

/**
 * Deserialize event from Buffer (from Kafka)
 */
export function deserializeEventFromBuffer<T extends BaseEvent>(
  buffer: Buffer,
): T {
  return deserializeEvent<T>(buffer.toString('utf-8'));
}

/**
 * Create event metadata
 */
export function createEventMetadata(
  eventType: string,
  source: string,
  options?: {
    correlationId?: string;
    userId?: string;
    eventVersion?: string;
  },
): EventMetadata {
  return {
    eventId: generateEventId(),
    eventType,
    eventVersion: options?.eventVersion || '1.0.0',
    timestamp: new Date().toISOString(),
    source,
    correlationId: options?.correlationId,
    userId: options?.userId,
  };
}

/**
 * Generate unique event ID
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `evt-${timestamp}-${random}`;
}

/**
 * Validate event structure
 */
export function validateEvent(event: any): boolean {
  if (!event || typeof event !== 'object') {
    return false;
  }

  if (!event.metadata || typeof event.metadata !== 'object') {
    return false;
  }

  const metadata = event.metadata;
  if (
    !metadata.eventId ||
    !metadata.eventType ||
    !metadata.eventVersion ||
    !metadata.timestamp ||
    !metadata.source
  ) {
    return false;
  }

  if (!event.payload || typeof event.payload !== 'object') {
    return false;
  }

  return true;
}
