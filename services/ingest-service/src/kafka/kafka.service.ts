import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { KAFKA_CONFIG } from '../config/env.constants';

/**
 * Kafka Service
 * 
 * Publishes ingest events to Kafka.
 */
@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: KAFKA_CONFIG.CLIENT_ID,
      brokers: [KAFKA_CONFIG.BROKER],
    });

    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  /**
   * Emit ingest.completed event
   */
  async emitIngestCompleted(data: {
    jobId: string;
    contentId: string;
    sourceType: string;
    sourceUrl: string;
  }): Promise<void> {
    try {
      await this.producer.send({
        topic: 'ingest.completed',
        messages: [
          {
            key: data.jobId,
            value: JSON.stringify({
              metadata: {
                eventId: `ingest-${Date.now()}`,
                eventType: 'ingest.completed',
                eventVersion: '1.0',
                timestamp: new Date().toISOString(),
                source: 'ingest-service',
              },
              payload: {
                jobId: data.jobId,
                contentId: data.contentId,
                sourceType: data.sourceType,
                sourceUrl: data.sourceUrl,
              },
            }),
          },
        ],
      });

      this.logger.log(`Ingest completed event emitted: ${data.jobId}`);
    } catch (error) {
      this.logger.error(`Failed to emit ingest.completed event: ${data.jobId}`, error);
    }
  }

  /**
   * Emit ingest.failed event
   */
  async emitIngestFailed(data: {
    jobId: string;
    sourceType: string;
    sourceUrl: string;
    error: string;
    retryCount: number;
  }): Promise<void> {
    try {
      await this.producer.send({
        topic: 'ingest.failed',
        messages: [
          {
            key: data.jobId,
            value: JSON.stringify({
              metadata: {
                eventId: `ingest-${Date.now()}`,
                eventType: 'ingest.failed',
                eventVersion: '1.0',
                timestamp: new Date().toISOString(),
                source: 'ingest-service',
              },
              payload: {
                jobId: data.jobId,
                sourceType: data.sourceType,
                sourceUrl: data.sourceUrl,
                error: data.error,
                retryCount: data.retryCount,
              },
            }),
          },
        ],
      });

      this.logger.log(`Ingest failed event emitted: ${data.jobId}`);
    } catch (error) {
      this.logger.error(`Failed to emit ingest.failed event: ${data.jobId}`, error);
    }
  }
}
