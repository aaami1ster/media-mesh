import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SearchService } from '../search/services/search.service';
import { KAFKA_CONFIG } from '../config/env.constants';
import { Kafka, Consumer } from 'kafkajs';
import { ContentType } from '@mediamesh/shared';

/**
 * Kafka Consumer Service
 * 
 * Consumes content and ingest events to update search index.
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: Consumer;

  constructor(private readonly searchService: SearchService) {
    const kafka = new Kafka({
      clientId: KAFKA_CONFIG.CLIENT_ID,
      brokers: [KAFKA_CONFIG.BROKER],
    });

    this.consumer = kafka.consumer({ groupId: KAFKA_CONFIG.GROUP_ID });
  }

  async onModuleInit() {
    await this.consumer.connect();
    
    // Subscribe to content events
    await this.consumer.subscribe({
      topics: [
        'content.created',
        'content.updated',
        'content.published',
        'content.deleted',
      ],
    });

    // Subscribe to ingest events
    await this.consumer.subscribe({
      topics: ['ingest.completed'],
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value?.toString() || '{}');
          await this.handleEvent(topic, event);
        } catch (error) {
          this.logger.error(`Error processing Kafka message: ${topic}`, error);
          // In production, you might want to send to a dead letter queue
        }
      },
    });

    this.logger.log('Kafka consumer started for search indexing');
  }

  private async handleEvent(topic: string, event: any): Promise<void> {
    this.logger.log(`Received event: ${topic}`, { eventId: event.metadata?.eventId });

    try {
      switch (topic) {
        case 'content.created':
        case 'content.updated':
        case 'content.published':
          await this.handleContentEvent(event);
          break;

        case 'content.deleted':
          await this.handleContentDeleted(event);
          break;

        case 'ingest.completed':
          await this.handleIngestCompleted(event);
          break;

        default:
          this.logger.warn(`Unknown event topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error handling event ${topic}:`, error);
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private async handleContentEvent(event: any): Promise<void> {
    const payload = event.payload;
    if (!payload) {
      this.logger.warn('Event payload missing');
      return;
    }

    const contentType = payload.contentType as ContentType;
    if (!contentType) {
      this.logger.warn('Content type missing in event');
      return;
    }

    // Index or update content
    await this.searchService.indexContent({
      contentId: payload.contentId || payload.id,
      contentType,
      title: payload.title || '',
      description: payload.description,
      category: payload.category,
      language: payload.language,
      tags: payload.tags,
    });

    this.logger.log(`Content indexed from event: ${payload.contentId}`);
  }

  private async handleContentDeleted(event: any): Promise<void> {
    const payload = event.payload;
    if (!payload || !payload.contentId) {
      this.logger.warn('Content ID missing in delete event');
      return;
    }

    await this.searchService.deleteFromIndex(payload.contentId);
    this.logger.log(`Content deleted from index: ${payload.contentId}`);
  }

  private async handleIngestCompleted(event: any): Promise<void> {
    const payload = event.payload;
    if (!payload || !payload.contentId) {
      this.logger.warn('Content ID missing in ingest completed event');
      return;
    }

    // Fetch content from CMS service and index it
    try {
      // In a real implementation, you would fetch the content details
      // For now, we'll just log that ingest completed
      this.logger.log(`Ingest completed for content: ${payload.contentId}`);
      
      // You could fetch content details from CMS service here
      // and then index it using searchService.indexContent()
    } catch (error) {
      this.logger.error(`Failed to index ingested content: ${payload.contentId}`, error);
    }
  }
}
