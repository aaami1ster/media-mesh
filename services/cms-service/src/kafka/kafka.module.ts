import { Module, Global } from '@nestjs/common';
import { KafkaService } from './kafka.service';

/**
 * Kafka Module for CMS Service
 * 
 * Provides Kafka producer functionality for emitting content events.
 */
@Global()
@Module({
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
