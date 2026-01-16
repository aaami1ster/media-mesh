import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, ProducerConfig } from 'kafkajs';
import {
  ContentEventType,
  ContentCreatedEvent,
  ContentUpdatedEvent,
  ContentPublishedEvent,
  EventMetadata,
  serializeEventToBuffer,
  createEventMetadata,
} from '@mediamesh/shared';
import { KAFKA_CONFIG } from '../config/env.constants';

/**
 * Kafka Service for CMS Service
 * 
 * Handles publishing content-related events to Kafka:
 * - content.created - when program/episode is created
 * - content.updated - when program/episode is updated
 * - content.published - when content is published
 */
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private producer: Producer;
  private kafka: Kafka;

  constructor() {
    this.kafka = new Kafka({
      clientId: KAFKA_CONFIG.CLIENT_ID,
      brokers: [KAFKA_CONFIG.BROKER],
    });

    const producerConfig: ProducerConfig = {
      allowAutoTopicCreation: true,
      retry: {
        retries: 3,
        initialRetryTime: 100,
        multiplier: 2,
      },
    };

    this.producer = this.kafka.producer(producerConfig);
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect Kafka producer', error);
    }
  }

  /**
   * Emit content.created event
   */
  async emitContentCreated(data: {
    contentId: string;
    contentType: 'PROGRAM' | 'EPISODE';
    title: string;
    description?: string;
    programId?: string; // For episodes
    episodeNumber?: number; // For episodes
    status: string;
    metadataId?: string;
    createdAt: Date;
    createdBy?: string;
    program?: any; // Full program data for episodes
  }): Promise<void> {
    try {
      const metadata = createEventMetadata(
        ContentEventType.CONTENT_CREATED,
        KAFKA_CONFIG.CLIENT_ID,
        {
          userId: data.createdBy,
        },
      );

      const event: ContentCreatedEvent = {
        metadata: {
          ...metadata,
          eventType: ContentEventType.CONTENT_CREATED,
        },
        payload: {
          contentId: data.contentId,
          contentType: data.contentType,
          title: data.title,
          createdBy: data.createdBy || 'system',
          program: data.program,
        },
      };

      await this.producer.send({
        topic: ContentEventType.CONTENT_CREATED,
        messages: [
          {
            key: data.contentId,
            value: serializeEventToBuffer(event),
            headers: {
              'event-type': ContentEventType.CONTENT_CREATED,
              'event-version': event.metadata.eventVersion,
              'content-type': data.contentType,
              'content-id': data.contentId,
            },
          },
        ],
      });

      this.logger.log(`Content created event emitted: ${data.contentId} (${data.contentType})`);
    } catch (error) {
      this.logger.error(`Failed to emit content.created event for ${data.contentId}`, error);
      // Don't throw - event emission failure shouldn't break the main flow
    }
  }

  /**
   * Emit content.updated event
   */
  async emitContentUpdated(data: {
    contentId: string;
    contentType: 'PROGRAM' | 'EPISODE';
    title: string;
    updatedBy?: string;
    changes: Record<string, { old: any; new: any }>;
    program?: any; // Full program data
  }): Promise<void> {
    try {
      const metadata = createEventMetadata(
        ContentEventType.CONTENT_UPDATED,
        KAFKA_CONFIG.CLIENT_ID,
        {
          userId: data.updatedBy,
        },
      );

      const event: ContentUpdatedEvent = {
        metadata: {
          ...metadata,
          eventType: ContentEventType.CONTENT_UPDATED,
        },
        payload: {
          contentId: data.contentId,
          contentType: data.contentType,
          title: data.title,
          updatedBy: data.updatedBy || 'system',
          changes: data.changes,
          program: data.program,
        },
      };

      await this.producer.send({
        topic: ContentEventType.CONTENT_UPDATED,
        messages: [
          {
            key: data.contentId,
            value: serializeEventToBuffer(event),
            headers: {
              'event-type': ContentEventType.CONTENT_UPDATED,
              'event-version': event.metadata.eventVersion,
              'content-type': data.contentType,
              'content-id': data.contentId,
            },
          },
        ],
      });

      this.logger.log(`Content updated event emitted: ${data.contentId} (${data.contentType})`);
    } catch (error) {
      this.logger.error(`Failed to emit content.updated event for ${data.contentId}`, error);
      // Don't throw - event emission failure shouldn't break the main flow
    }
  }

  /**
   * Emit content.published event
   */
  async emitContentPublished(data: {
    contentId: string;
    contentType: 'PROGRAM' | 'EPISODE';
    title: string;
    publishedBy?: string;
    publishedAt: Date;
    program?: any; // Full program data
  }): Promise<void> {
    try {
      const metadata = createEventMetadata(
        ContentEventType.CONTENT_PUBLISHED,
        KAFKA_CONFIG.CLIENT_ID,
        {
          userId: data.publishedBy,
        },
      );

      const event: ContentPublishedEvent = {
        metadata: {
          ...metadata,
          eventType: ContentEventType.CONTENT_PUBLISHED,
        },
        payload: {
          contentId: data.contentId,
          contentType: data.contentType,
          title: data.title,
          publishedBy: data.publishedBy || 'system',
          publishedAt: data.publishedAt.toISOString(),
          program: data.program,
        },
      };

      await this.producer.send({
        topic: ContentEventType.CONTENT_PUBLISHED,
        messages: [
          {
            key: data.contentId,
            value: serializeEventToBuffer(event),
            headers: {
              'event-type': ContentEventType.CONTENT_PUBLISHED,
              'event-version': event.metadata.eventVersion,
              'content-type': data.contentType,
              'content-id': data.contentId,
            },
          },
        ],
      });

      this.logger.log(`Content published event emitted: ${data.contentId} (${data.contentType})`);
    } catch (error) {
      this.logger.error(`Failed to emit content.published event for ${data.contentId}`, error);
      // Don't throw - event emission failure shouldn't break the main flow
    }
  }
}
