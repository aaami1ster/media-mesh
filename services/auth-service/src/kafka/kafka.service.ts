import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, ProducerConfig } from 'kafkajs';
import { KAFKA_CONFIG } from '../config/env.constants';
import {
  AuthEventType,
  UserCreatedEvent,
  UserUpdatedEvent,
  createEventMetadata,
  serializeEventToBuffer,
} from '@mediamesh/shared';

/**
 * Kafka Service
 * 
 * Handles Kafka producer operations for event publishing.
 * Emits authentication-related events to Kafka topics.
 */
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: KAFKA_CONFIG.CLIENT_ID,
      brokers: [KAFKA_CONFIG.BROKER],
      retry: {
        retries: 5,
        initialRetryTime: 100,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    });

    const producerConfig: ProducerConfig = {
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    };

    this.producer = this.kafka.producer(producerConfig);
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
      // Don't throw - allow service to start without Kafka
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka producer', error);
    }
  }

  /**
   * Emit user created event
   */
  async emitUserCreated(event: {
    payload: UserCreatedEvent['payload'];
    correlationId?: string;
  }): Promise<void> {
    try {
      const metadata = createEventMetadata(
        AuthEventType.USER_CREATED,
        KAFKA_CONFIG.CLIENT_ID,
        {
          userId: event.payload.userId,
          correlationId: event.correlationId,
        },
      );

      const fullEvent: UserCreatedEvent = {
        metadata: {
          ...metadata,
          eventType: AuthEventType.USER_CREATED,
        },
        payload: event.payload,
      };

      await this.producer.send({
        topic: AuthEventType.USER_CREATED,
        messages: [
          {
            key: event.payload.userId,
            value: serializeEventToBuffer(fullEvent),
            headers: {
              'event-type': AuthEventType.USER_CREATED,
              'event-version': fullEvent.metadata.eventVersion,
            },
          },
        ],
      });

      this.logger.log(`User created event emitted: ${event.payload.userId}`);
    } catch (error) {
      this.logger.error('Failed to emit user created event', error);
      // Don't throw - event emission failure shouldn't break the request
    }
  }

  /**
   * Emit user updated event
   */
  async emitUserUpdated(event: {
    payload: UserUpdatedEvent['payload'];
    correlationId?: string;
  }): Promise<void> {
    try {
      const metadata = createEventMetadata(
        AuthEventType.USER_UPDATED,
        KAFKA_CONFIG.CLIENT_ID,
        {
          userId: event.payload.userId,
          correlationId: event.correlationId,
        },
      );

      const fullEvent: UserUpdatedEvent = {
        metadata: {
          ...metadata,
          eventType: AuthEventType.USER_UPDATED,
        },
        payload: event.payload,
      };

      await this.producer.send({
        topic: AuthEventType.USER_UPDATED,
        messages: [
          {
            key: event.payload.userId,
            value: serializeEventToBuffer(fullEvent),
            headers: {
              'event-type': AuthEventType.USER_UPDATED,
              'event-version': fullEvent.metadata.eventVersion,
            },
          },
        ],
      });

      this.logger.log(`User updated event emitted: ${event.payload.userId}`);
    } catch (error) {
      this.logger.error('Failed to emit user updated event', error);
      // Don't throw - event emission failure shouldn't break the request
    }
  }

  /**
   * Generic method to emit any event
   */
  async emitEvent(
    topic: string,
    key: string,
    event: any,
    headers?: Record<string, string>,
  ): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key,
            value: typeof event === 'string' ? Buffer.from(event) : serializeEventToBuffer(event),
            headers: {
              'event-type': topic,
              ...headers,
            },
          },
        ],
      });

      this.logger.debug(`Event emitted to topic ${topic}: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to emit event to topic ${topic}`, error);
      // Don't throw - event emission failure shouldn't break the request
    }
  }
}
