import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '../discovery/services/discovery.service';
import { KAFKA_CONFIG } from '../config/env.constants';
import { Kafka, Consumer } from 'kafkajs';

/**
 * Kafka Service
 * 
 * Listens to content update events and invalidates cache.
 */
@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  private consumer: Consumer;

  constructor(private readonly discoveryService: DiscoveryService) {
    const kafka = new Kafka({
      clientId: KAFKA_CONFIG.CLIENT_ID,
      brokers: [KAFKA_CONFIG.BROKER],
    });

    this.consumer = kafka.consumer({ groupId: KAFKA_CONFIG.GROUP_ID });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: ['content.updated', 'content.published', 'content.deleted'],
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const event = JSON.parse(message.value?.toString() || '{}');
          await this.handleContentEvent(topic, event);
        } catch (error) {
          this.logger.error(`Error processing Kafka message: ${topic}`, error);
        }
      },
    });

    this.logger.log('Kafka consumer started for cache invalidation');
  }

  private async handleContentEvent(topic: string, event: any): Promise<void> {
    this.logger.log(`Received event: ${topic}`, event);

    switch (topic) {
      case 'content.updated':
      case 'content.published':
        if (event.payload?.contentType === 'PROGRAM' && event.payload?.contentId) {
          await this.discoveryService.invalidateProgramCache(event.payload.contentId);
          await this.discoveryService.invalidateProgramEpisodesCache(event.payload.contentId);
          await this.discoveryService.invalidateSearchCache();
        }
        break;

      case 'content.deleted':
        if (event.payload?.contentType === 'PROGRAM' && event.payload?.contentId) {
          await this.discoveryService.invalidateProgramCache(event.payload.contentId);
          await this.discoveryService.invalidateProgramEpisodesCache(event.payload.contentId);
          await this.discoveryService.invalidateSearchCache();
        }
        break;
    }
  }
}
